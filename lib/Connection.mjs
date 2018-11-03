import { createConnection } from 'net';
import DataStore from './Connection/DataStore';
import CommandQueue from './Connection/CommandQueue';
import VALID_EVENTS from './Connection/valid_events.json';
import VALID_HOOKS from './Connection/valid_hooks.json';
import { parseArgs, parseParams } from './Connection/Utils';
import Log from './Log.mjs';

// constants
const STATE = {
    CLOSED: 0,
    READY: 1,
    AWAITING_DATA: 2,
    PROCESSING_DATA: 3,
    INIT: 4
};

/*
1: Single item response
2: Array/list response, items seperated by "|"
*/
const SHOULD_PARSE_PARAMS = {
    error: 1,
    serverinfo: 1,
    serverlist: 2,
    clientinfo: 1,
    clientlist: 2,
    channelinfo: 1,
    channellist: 2,
    logview: 2,
};

export default class Connection {
    constructor(config) {
        this.state = STATE.CLOSED;
        this.registeredHooks = {};
        this.REGISTERED_EVENTS = {};

        this.store = new DataStore(this);
        this.commandQueue = new CommandQueue(this);
        this.commandResult = {};

        this.buffer = "";

        this.pingTimer;

        this.onError = this.onError.bind(this);
        this.onLookup = this.onLookup.bind(this);
        this.onTimeout = this.onTimeout.bind(this);
        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);

        this.connectionCallback = this.connectionCallback.bind(this);
        this.errorHook = this.errorHook.bind(this);

        this.connection = this.init(config);
    }

    connected() {
        return this.state !== STATE.CLOSED;
    }
    connecting() {
        return this.connection.connecting;
    }
    ready() {
        return this.state === STATE.READY;
    }

    init(config) {
        Log(`Connecting to ${config.auth.host}:${config.auth.port}`, 3);
        return new createConnection({
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
        // Send "ping" every minute
        this.pingTimer = setInterval(() => {
            Log("Sending heartbeat...", 5);
            this.send('version', undefined, {noOutput: true}, 0);
        }, 60000);
        this.state = STATE.INIT;
        this.registerHook('error', {
            error: this.errorHook
        });
    }

    errorHook(params) {
        if (params.id !== '0') {
            Log(`Error check failed: ${JSON.stringify(this.commandQueue.getCommand())}, ${JSON.stringify(params)}`, 2);
            this.getCommand().failed = true;
            this.getCommand().reject(params);
        } else {
            this.getCommand().resolve(this.commandResult || {result: "OK"});
        }
    }

    onError(e) {
        Log(`ERROR: ${e}`, 1);
    }

    onLookup() {
        Log(`event:lookup ${JSON.stringify(arguments)}`, 5);
    }

    onTimeout() {
        Log(`event:timeout ${JSON.stringify(arguments)}`, 5);
    }

    onData(data) {
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
    processData(msg) {
        this.state = STATE.PROCESSING_DATA;
        const lines = msg.split("\n\r");

        // Find event packet, should be the last packet/line in a message from the server
        const eventPacket = lines.filter(line => {
            const event = line.substr(0, line.indexOf(" "));
            return this.registeredHooks[event] !== undefined
        }).length;

        if (eventPacket) {
            this.recievedData(this.buffer + msg);
            this.buffer = "";
        } else {
            this.buffer += msg;
        }
    }

    onClose(hadError) {
        this.state = STATE.CLOSED;
        let logMsg = "Closing connection...";
        let logLevel = 3;
        if (hadError) {
            logMsg += " Undefined error";
            logLevel = 1;
        }
        Log(logMsg, logLevel);
        clearInterval(this.pingTimer);
    }

    recievedData(msg) {
        if (this.getCommand().label === 'help') {
            process.stdout.write(msg);
            this.state = STATE.READY;
        } else {
            this.parseRecievedData(msg);
        }
    }

    parseRecievedData(msg) {
        for (let line of msg.split("\n")) {
            line = line.trim();
            if (!line) {
                continue;
            }
            const event = line.substr(0, line.indexOf(" "));

            this.handleRecievedLine(event, line);
        }
    }

    handleRecievedLine(event, line) {
        const params = this.registeredHooks[event]
            ? parseParams(line, 1, event.length + 1)
            : parseParams(line, SHOULD_PARSE_PARAMS[this.getCommand().label]);

        if (VALID_HOOKS[event]) {
            this.recievedEvent(params, event, line);
        } else {
            this.commandResult = params;
        }
    }

    recievedEvent(params, event, msg) {
        if (this.registeredHooks[event]) {
            for (let pluginHooks of Object.values(this.registeredHooks[event])) {
                for (let callback of pluginHooks) {
                    callback(params, msg);
                }
            }
        }
        this.state = STATE.READY;
    }

    retryCommand() {
        const command = this.getCommand();
        this.commandQueue.add(command.labe, command.options, 0, command.command, command.resolve, command.reject);
    }

    skipCommand() {
        if (this.getCommand().failed) {
            this.commandQueue.processQueue();
        } else {
            this.getCommand().reject('skipped');
            this.state = STATE.READY;
            this.commandQueue.processQueue();
        }
    }

    clearCommandQueue() {
        this.commandQueue.clearQueue(0);
    }

    getCommandQueue() {
        return this.commandQueue;
    }

    getCommand() {
        return this.commandQueue.getCommand();
    }

    writeRaw(str) {
        this.commandResult = false;
        this.state = STATE.AWAITING_DATA;
        let logLevel = this.getCommand().options.noOutput ? 5 : 3;
        Log(`writeRaw(): ${str.replace("\r\n", "\\r\\n")}`, logLevel);
        this.connection.write(Buffer.from(str, 'utf8'));
    }

    writeToConnection(str) {
        this.writeRaw(str + "\r\n");
    }

    send(cmd, args, options, priority = 0) {
        if (!cmd) {
            return;
        }
        return new Promise((resolve, reject) => {
            let argString = parseArgs(cmd, args);
            this.commandQueue.add(cmd, options, priority, () => {
                this.writeToConnection(argString);
            }, resolve, reject);
        });
    }

    registerHook(event, callbacks, id = "connection") {
        for (let hook of Object.keys(callbacks)) {
            if (VALID_EVENTS[event][hook]) {
                if (this.registeredHooks[hook] === undefined) {
                    this.registeredHooks[hook] = {};
                }
                if (this.registeredHooks[hook][id] === undefined) {
                    this.registeredHooks[hook][id] = [];
                }
                this.registeredHooks[hook][id].push(callbacks[hook]);
            } else {
                Log(`Invalid hook: ${hook}, event: ${event}`, 2);
                return false;
            }
        }
        return true;
    }

    registerEvent(event, options, callbacks, id) {
        if (VALID_EVENTS[event]) {
            if (this.registerHook(event, callbacks, id)) {
                // TODO: why is this code? #comments
                // if (options && options.id) {
                //     event += options.id;
                // }
                if (!this.REGISTERED_EVENTS[event]) {
                    this.REGISTERED_EVENTS[event] = true;
                    this.send('servernotifyregister', {
                        event,
                        ...options
                    });
                }
            }
        }
    }

    unregisterHook(event, hook, id) {
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
    unregisterEvent(event, hooks, id) {
        if (VALID_EVENTS[event]) {
            for (let hook of hooks) {
                this.unregisterHook(event, hook, id);
            }
        }
    }
}
