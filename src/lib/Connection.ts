import {
    createConnection, Socket
} from "net";
import * as chalk from "chalk";
import DataStore from "./Connection/DataStore";
import CommandQueue from "./Connection/CommandQueue";
import {
    parseArgsToString,
    parseParams
} from "./Connection/Utils";
import Log from "./Log";
import { TSCommandList, TSReturnValue } from './commands';
import { BotConfig } from "./Types/Config";
import valid_events, { ValidEvents, EventHooks, ValidHooks } from "./Connection/valid_events";


type CommandOptions = {
    noOutput?: boolean,
    expectData?: boolean,
    mustReturnOK?: boolean
};

export type Command = {
    label: string;
    commandStr: string;
    command: Function,
    resolve: Function,
    reject: Function,
    options: CommandOptions,
    failed?: boolean
};

interface TS_ErrorState {
    id: string|number,
    msg: string
}

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

export default class Connection {
    private state: STATE = STATE.CLOSED;
    private registeredHooks: { [hook: string]: HookList } = {};
    private REGISTERED_EVENTS: { [event in ValidEvents]?: boolean } = {};
    store: DataStore;
    private commandQueue: CommandQueue;
    private commandResult: boolean | object = {};
    private buffer: string = "";
    private pingTimer: null | NodeJS.Timeout = null;
    private socket: Socket;

    constructor(config: BotConfig) {
        this.store = new DataStore(this);
        this.commandQueue = new CommandQueue(this);

        this.registerHook(ValidEvents.error, {
            error: this.errorHook
        });

        this.socket = this.init(config);
    }

    socketOn(event: string, cb: (...args: any[]) => void) {
        this.socket.on(event, cb);
    }

    connected() : boolean {
        return this.state !== STATE.CLOSED;
    }
    connecting() : boolean {
        return this.socket.connecting;
    }
    ready() : boolean {
        return this.state === STATE.READY;
    }
    reconnect(config: BotConfig) : void {
        this.socket = this.init(config);
    }
    disconnect() : void {
        if (this.connected()) {
            this.socket.destroy();
        }
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
    connectionCallback = () => {
        Log("Connected!", this.constructor.name);
        // Send "ping" every minute
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
        this.pingTimer = setInterval(this.heartbeat, 60000);
        this.state = STATE.INIT;
    }

    heartbeat = async () => {
        Log("Sending heartbeat...", this.constructor.name, 4);
        const startTime = process.hrtime();
        await this.send('version', null, {
            noOutput: true
        }, 0);
        const diff = process.hrtime(startTime);
        const ping = diff[0] > 0 ? diff[0] / 1e6 : 0 + diff[1] / 1e6;
        Log(`Ping: ${ping}ms`, this.constructor.name, 5);
    }

    errorHook = (params: TS_ErrorState) => {
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

    onError = (e: Error) => {
        Log(`${e}`, this.constructor.name, 1);
    }

    onLookup = () => {
        Log(`event:lookup`, this.constructor.name, 5);
    }

    onTimeout = () => {
        Log(`event:timeout`, this.constructor.name, 5);
    }

    onClose = (hadError: boolean) => {
        this.state = STATE.CLOSED;
        Log("Closing connection...", this.constructor.name, hadError ? 1 : 3);
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
    }
    onData = (data: Buffer) => {
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
        if (event in ValidHooks) {
            this.recievedEvent(parseParams(line, 1, event.length + 1), event, line);
        } else {
            this.commandResult = parseParams(line, SHOULD_PARSE_PARAMS[this.commandQueue.getCommand().label]);
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
        Log(`writeRaw(${data.replace("\r\n", "\\r\\n")})`, this.constructor.name, logLevel);
        this.socket.write(Buffer.from(data, 'utf8'));
    }

    writeToConnection(data: string) {
        this.writeRaw(data + "\r\n");
    }

    /**
     * @param cmd Name of the command to be sent to teamspeak server
     * @param args
     * @param options Options..
     * @param priority 0=highest, 2=lowest
     */
    send<K extends keyof TSCommandList>(cmd: K, args?: TSCommandList[K], options: CommandOptions = {}, priority: number = 0): Promise<TSReturnValue[K]> {
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

    registerHook<E extends ValidEvents, H extends EventHooks[E]>(event: E, callbacks: { [key in H]?: Function}, id: string = "connection") {
        for (const hook of Object.keys(callbacks) as Array<H>) {
            if (hook in valid_events[event]) {
                this._pushHook(hook as any, id, callbacks[hook] as Function);
            } else {
                Log(`Invalid hook: ${hook}, event: ${event}`, this.constructor.name, 2);
                return false;
            }
        }
        return true;
    }
    _pushHook(hook: string, id: string, callback: Function) {
        if (this.registeredHooks[hook] === undefined) {
            this.registeredHooks[hook] = {};
        }
        if (this.registeredHooks[hook][id] === undefined) {
            this.registeredHooks[hook][id] = [];
        }
        this.registeredHooks[hook][id].push(callback);
    }

    registerEvent<E extends ValidEvents, H extends EventHooks[E]>(event: E, options: object|null, callbacks: { [key in H]?: Function}, id: string) {
        if (valid_events[event]) {
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

    unregisterHook<E extends ValidEvents, H extends EventHooks[E]>(event: E, hook: H, id: string) {
        if (
            hook in valid_events[event] &&
            this.registeredHooks[hook] &&
            this.registeredHooks[hook][id]
        ) {
            delete this.registeredHooks[hook][id];
            if (Object.keys(this.registeredHooks[hook]).length === 0) {
                delete this.registeredHooks[hook];
            }
        }
    }
    unregisterEvent<E extends ValidEvents, H extends EventHooks[E]>(event: E, hooks: H[], id: string) {
        if (valid_events[event]) {
            for (let hook of hooks) {
                this.unregisterHook(event, hook, id);
            }
        }
    }
}
