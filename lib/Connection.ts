/// <reference path="Types/Config.d.ts" />
/// <reference path="Types/Types.d.ts" />
/// <reference path="Types/Server.d.ts" />
/// <reference path="Types/Events.d.ts" />

import {
    createConnection, Socket
} from "net";
import chalk from "chalk";
import DataStore from "./Connection/DataStore";
import CommandQueue from "./Connection/CommandQueue";
import VALID_EVENTS from "./Connection/valid_events";
import VALID_HOOKS from "./Connection/valid_hooks";
import {
    parseArgsToString,
    parseParams
} from "./Connection/Utils";
import Log from "./Log";
import { TSCommandParamDefinion, TSCommandList } from './commands';

// constants
enum STATE {
    CLOSED = 0,
    READY = 1,
    AWAITING_DATA = 2,
    PROCESSING_DATA = 3,
    INIT = 4
};

enum ParamTypes {
    SingleItem = 1,
    List = 2,
};

type HookList = {
    [id:string]: Function[]
};

/*
1: Single item response
2: Array/list response, items seperated by "|"
*/
const SHOULD_PARSE_PARAMS: {[key:string]: number} = {
    error: ParamTypes.SingleItem,
    serverinfo: ParamTypes.SingleItem,
    serverlist: ParamTypes.List,
    clientinfo: ParamTypes.SingleItem,
    clientlist: ParamTypes.List,
    channelinfo: ParamTypes.SingleItem,
    channellist: ParamTypes.List,
    logview: ParamTypes.List,
};

// interface TSConnection {
//     send<K extends keyof TSCommandList>(cmd: K, param: TSCommandList[K]["params"], options: CommandOptions, priority: number): Promise<any>;
// }


export default class Connection {
    state: STATE;
    registeredHooks: { [event: string]: HookList };
    REGISTERED_EVENTS: { [event: string]: boolean };
    store: DataStore;
    commandQueue: CommandQueue;
    commandResult: boolean | object;
    buffer: string;
    pingTimer: null | NodeJS.Timeout;
    connection: Socket;

    constructor(config: BotConfig) {
        this.state = STATE.CLOSED;
        this.registeredHooks = {};
        this.REGISTERED_EVENTS = {};

        this.store = new DataStore(this);
        this.commandQueue = new CommandQueue(this);
        this.commandResult = {};

        this.buffer = "";

        this.pingTimer = null;

        this.onError = this.onError.bind(this);
        this.onLookup = this.onLookup.bind(this);
        this.onTimeout = this.onTimeout.bind(this);
        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);

        this.heartbeat = this.heartbeat.bind(this);
        this.connectionCallback = this.connectionCallback.bind(this);
        this.errorHook = this.errorHook.bind(this);

        this.connection = this.init(config);
    }

    connected() : boolean {
        return this.state !== STATE.CLOSED;
    }
    connecting() : boolean {
        return this.connection.connecting;
    }
    ready() : boolean {
        return this.state === STATE.READY;
    }

    init(config: BotConfig) : Socket {
        Log(`Connecting to ${config.auth.host}:${config.auth.port}`, this.constructor.name, 3);
        return createConnection({
                port: config.auth.port,
                host: config.auth.host
            }, this.connectionCallback)
            .on('error', this.onError)
            .on('lookup', this.onLookup)
            .on('timeout', this.onTimeout)
            .on('data', this.onData)
            .on('close', this.onClose);
    }
    connectionCallback() {
        Log("Connected!", this.constructor.name);
        // Send "ping" every minute
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
        this.pingTimer = setInterval(this.heartbeat, 60000);
        this.state = STATE.INIT;
        this.registerHook("error", {
            error: this.errorHook
        });
    }

    async heartbeat() {
        Log("Sending heartbeat...", this.constructor.name, 4);
        const startTime = process.hrtime();
        await this.send('version', null, {
            noOutput: true
        }, 0);
        const diff = process.hrtime(startTime);
        const ping = diff[0] > 0 ? diff[0] / 1e6 : 0 + diff[1] / 1e6;
        Log(`Ping: ${ping}ms`, this.constructor.name, 5);
    }

    errorHook(params: TS_ErrorState) {
        if (params.id !== '0') {
            const command = this.commandQueue.getCommand();
            if (command) {
                Log(`Command failed: ${chalk.yellow(command.commandStr)} ${JSON.stringify(command)}, ${JSON.stringify(params)}`, this.constructor.name, 2);
                command.failed = true;
                command.reject(params);
            }
        } else {
            this.commandQueue.getCommand().resolve(this.commandResult || {
                result: "OK"
            });
        }
    }

    onError(e: Error) {
        Log(`ERROR: ${e}`, this.constructor.name, 1);
    }

    onLookup() {
        Log(`event:lookup ${JSON.stringify(arguments)}`, this.constructor.name, 5);
    }

    onTimeout() {
        Log(`event:timeout ${JSON.stringify(arguments)}`, this.constructor.name, 5);
    }

    onClose(hadError: boolean) {
        this.state = STATE.CLOSED;
        Log("Closing connection...", this.constructor.name, hadError ? 1 : 3);
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
    }
    onData(data: Buffer) {
        const msg = data.toString('utf8');

        if (this.state === STATE.INIT) {
            // TeamSpeak always sends a "welcome" packet on established connection
            this.state = STATE.READY;
        } else {
            this.processData(msg);
        }
        if (this.ready()) {
            this.commandQueue.processQueue();
        }
    }
    processData(msg: string) {
        this.state = STATE.PROCESSING_DATA;

        // Weird stuff happened, making sure this is the last "packet" for this event/msg
        const lastPacket = msg.substr(msg.length - 2) === "\n\r";

        if (lastPacket) {
            this.recievedData(this.buffer + msg);
            this.buffer = "";
        } else {
            this.buffer += msg;
        }
    }

    recievedData(msg: string) {
        if (this.commandQueue.getCommand().label === 'help') {
            process.stdout.write(msg);
        } else {
            Log(`Recieved data: ${msg}`, this.constructor.name, 5);
            this.parseRecievedData(msg);
        }
        this.state = STATE.READY;
    }

    parseRecievedData(msg: string) {
        for (let line of msg.split("\n\r")) {
            line = line.trim();
            if (!line) {
                continue;
            }
            const event = line.substr(0, line.indexOf(" "));
            this.handleRecievedLine(line, event);
        }
    }

    handleRecievedLine(line: string, event: string) {
        const params = VALID_HOOKS[event] ?
            parseParams(line, 1, event.length + 1) :
            parseParams(line, SHOULD_PARSE_PARAMS[this.commandQueue.getCommand().label]);

        if (VALID_HOOKS[event]) {
            this.recievedEvent(params, event, line);
        } else {
            this.commandResult = params;
        }
    }

    recievedEvent(params: any, event: string, msg: string) {
        if (this.registeredHooks[event]) {
            for (let pluginHooks of Object.values(this.registeredHooks[event])) {
                for (let callback of Object.values(pluginHooks)) {
                    callback(params, msg);
                }
            }
        }
    }

    // checkValidCommand(cmd: TeamSpeakCommand): cmd is TeamSpeakCommand {
        
    // }

    getCommand() {
        return this.commandQueue.getCommand();
    }
    
    retryCommand() {
        const command = this.commandQueue.getCommand();
        if (command) {
            this.commandQueue.add(command, 0);
        }
    }

    skipCommand() {
        const command = this.commandQueue.getCommand();
        if (command) {
            if (command.failed) {
                this.commandQueue.processQueue();
            } else {
                command.reject('skipped');
                this.state = STATE.READY;
                this.commandQueue.processQueue();
            }
        }
    }

    clearCommandQueue() {
        this.commandQueue.clearQueue(0);
    }

    getCommandQueue(): CommandQueue {
        return this.commandQueue;
    }

    writeRaw(data: string) {
        this.commandResult = false;
        this.state = STATE.AWAITING_DATA;
        // TODO: change how we log this, should be opt-in if we should log to level 3
        let logLevel = this.commandQueue.getCommand().options.noOutput ? 5 : 4;
        Log(`writeRaw(): ${data.replace("\r\n", "\\r\\n")}`, this.constructor.name, logLevel);
        this.connection.write(Buffer.from(data, 'utf8'));
    }

    writeToConnection(data: string) {
        this.writeRaw(data + "\r\n");
    }

    /**
     * @param cmd Name of the command to be sent to teamspeak server
     * @param args DO NOT USE A STRING, use a JSON structure
     * @param options Options..
     * @param priority 0=highest, 2=lowest
     */
    send<K extends keyof TSCommandList>(cmd: K, args?: TSCommandList[K]|null, options: CommandOptions = {}, priority: number = 0): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!cmd || typeof cmd !== "string") {
                reject();
                return;
            }
            let commandStr = args ? parseArgsToString(cmd, args) : cmd;
            const command: Command = {
                label: cmd,
                command: () => {
                    this.writeToConnection(commandStr);
                },
                commandStr,
                options,
                resolve,
                reject
            };
            this.commandQueue.add(command, priority);
        });
    }

    registerHook(event: TS_Events, callbacks: TS_EventHooks, id: string = "connection") {
        for (let hook of Object.keys(callbacks)) {
            if (VALID_EVENTS[event][hook] ) {
                this._pushHook(hook as TS_ValidEventHooks, id, callbacks[hook as TS_ValidEventHooks] as Function);
            } else {
                Log(`Invalid hook: ${hook}, event: ${event}`, this.constructor.name, 2);
                return false;
            }
        }
        return true;
    }
    _pushHook(hook: TS_ValidEventHooks, id: string, callback: Function) {
        if (this.registeredHooks[hook] === undefined) {
            this.registeredHooks[hook] = {};
        }
        if (this.registeredHooks[hook][id] === undefined) {
            this.registeredHooks[hook][id] = [];
        }
        this.registeredHooks[hook][id].push(callback);
    }

    registerEvent(event: TS_Events, options: object|null, callbacks: TS_EventHooks, id: string) {
        if (VALID_EVENTS[event]) {
            if (this.registerHook(event, callbacks, id)) {
                if (!this.REGISTERED_EVENTS[event]) {
                    this.REGISTERED_EVENTS[event] = true;
                    this.send("servernotifyregister", {
                        event,
                        ...options
                    });
                }
            }
        }
    }

    unregisterHook(event: TS_Events, hook: TS_ValidEventHooks, id: string) {
        if (
            VALID_EVENTS[event][hook] &&
            this.registeredHooks[hook] &&
            this.registeredHooks[hook][id]
        ) {
            delete this.registeredHooks[hook][id];
            if (Object.keys(this.registeredHooks[hook]).length === 0) {
                delete this.registeredHooks[hook];
            }
        }
    }
    unregisterEvent(event: TS_Events, hooks: TS_ValidEventHooks[], id: string) {
        if (VALID_EVENTS[event]) {
            for (let hook of hooks) {
                this.unregisterHook(event, hook, id);
            }
        }
    }
}
