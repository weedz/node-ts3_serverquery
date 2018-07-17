import { createConnection } from 'net';
import DataStore from './Connection/DataStore';
import CommandQueue from './Connection/CommandQueue';
import VALID_EVENTS from './Connection/valid_events.json';
import VALID_HOOKS from './Connection/valid_hooks.json';

// constants
const STATE = {
    CLOSED: 0,
    READY: 1,
    AWAITING_DATA: 2,
    PROCESSING_DATA: 3,
    INIT: 4
};
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
const REGISTERED_EVENTS = {};

function parseParams(msg, type, start = 0) {
    if (type === 2) {
        return msg.split("|").map(item => parseParams(item, 1));
    }
    if (type !== 0) {
        const params = {};
        const paramArray = msg.substr(start).trim()
            .split(" ")
            .map(param => param.split("="));
        for (let param of paramArray) {
            params[param[0]] = param[1];
        }
        return params;
    }
    return false;
}

export default class Connection {
    constructor(config) {
        this.state = STATE.CLOSED;
        this.registeredHooks = {};

        this.store = new DataStore(this);
        this.commandQueue = new CommandQueue(this);
        this.commandResult = {};

        this.buffer = "";

        this.pingTimer;

        this.onData = this.onData.bind(this);
        this.onClose = this.onClose.bind(this);

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
        if (config.debug) {
            console.log(`Connecting to ${config.auth.host}:${config.auth.port}`);
        }
        return new createConnection({
            port: config.auth.port,
            host: config.auth.host
        }, () => {
            // Send "ping" every 5 minute
            this.pingTimer = setInterval(() => {
                this.send('version', undefined, {noOutput: true}, 0);
            }, 300000);
            this.state = STATE.INIT;
            this.registerHook('error', {
                error: (params) => {
                    if (params.id !== '0') {
                        console.log("Error check failed: ", params);
                        this.getCommand().failed = true;
                        if (this.getCommand().options.mustReturnOK) {
                            this.getCommand().reject(params);
                        }
                    } else {
                        this.getCommand().resolve(this.commandResult);
                    }
                }
            });
        })
            .on('error', e => {
                console.warn("ERROR: ", e);
            })
            .on('lookup', function() {
                if (config.debug) {
                    console.log("event:lookup", arguments);
                }
            })
            .on('timeout', function() {
                if (config.debug) {
                    console.log("event:timeout", arguments)
                }
            })
            .on('data', this.onData)
            .on('close', this.onClose);
    }

    onData(data) {
        const msg = data.toString('utf8');

        if (this.state === STATE.INIT) {
            // TeamSpeak always sends a "welcome" packet on established connection
            this.state = STATE.READY;
        } else {
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
        if (this.ready()) {
            this.commandQueue.processQueue();
        }
    }
    onClose(hadError) {
        this.state = STATE.CLOSED;
        if (hadError) {
            console.error("Error!");
        } else {
            console.info("Connection closed.");
        }
        clearInterval(this.pingTimer);
    }

    recievedData(msg) {
        if (this.getCommand().label === 'help') {
            process.stdout.write(msg);
            this.state = STATE.READY;
        } else {
            for (let line of msg.split("\n")) {
                line = line.trim();
                if (!line) {
                    continue;
                }
                const event = line.substr(0, line.indexOf(" "));

                const params = this.registeredHooks[event]
                    ? parseParams(line, 1, event.length + 1)
                    : parseParams(line, SHOULD_PARSE_PARAMS[this.getCommand().label]);

                if (VALID_HOOKS[event]) {
                    this.recievedEvent(params, event, line);
                } else {
                    this.commandResult = params;
                }
            }
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
        this.commandResult = {};
        this.state = STATE.AWAITING_DATA;
        if (!this.getCommand().options.noOutput) {
            console.log(`[${new Date().toISOString()}]: WRITE: ${str.replace("\r\n", "\\r\\n")}`);
        }
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
            let str;
            if (typeof args === 'object') {
                if (Array.isArray(args)) {
                    str = `${cmd} ${args.join(" ")}`;
                } else {
                    const params = Object.entries(args).map(([key, value]) => `${key}=${value}`).join(" ");
                    str = `${cmd} ${params}`;
                }
            } else if (typeof args === 'string') {
                str = `${cmd} ${args}`;
            } else {
                str = cmd;
            }
            this.commandQueue.add(cmd, options, priority, () => {
                this.writeToConnection(str);
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
                console.error(`Invalid hook: ${hook}, event: ${event}`);
                return false;
            }
        }
        return true;
    }

    registerEvent(event, options, callbacks, id) {
        if (VALID_EVENTS[event]) {
            let validHooks = this.registerHook(event, callbacks, id);
            if (validHooks) {
                const args = {
                    event,
                    ...options
                };
                if (options && options.id) {
                    event += options.id;
                }
                if (!REGISTERED_EVENTS[event]) {
                    REGISTERED_EVENTS[event] = true;
                    this.send('servernotifyregister', args);
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
