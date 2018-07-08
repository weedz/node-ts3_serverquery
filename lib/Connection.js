"use strict";
const net = require('net');
const DataStore = require('./DataStore');

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
const VALID_EVENTS = require('./valid_events.json');
const VALID_HOOKS = require('./valid_hooks.json');
const REGISTERED_EVENTS = {};

function parseParams(msg, type, start = 0) {
    if (type === 2) {
        return msg.split(/\|/g).map(item => parseParams(item, 1));
    }
    if (type !== 0) {
        const params = {};
        for (let param of msg.substr(start).trim().split(" ").map(param => param.split("="))) {
            params[param[0]] = param[1];
        }
        return params;
    }
    return false;
}
class Connection {
    constructor(config) {
        this.state = STATE.CLOSED;
        this.currentCommand = false;
        this.commandQueue = {
            0: [],
            1: [],
            2: []
        };
        this.registeredHooks = {};

        this.store = new DataStore(this);

        this.buffer = "";

        this.pingTimer;

        this.connection = new net.createConnection({
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
                    // DEBUG
                    if (params.id !== '0') {
                        console.log("Error check failed: ", params);
                        this.currentCommand.failed = true;
                        if (this.currentCommand.options.mustReturnOK) {
                            this.currentCommand.reject(params);
                        }
                    }
                }
            });
        });
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

    recievedCommand(params, msg) {
        if (this.currentCommand && this.currentCommand.options && !this.currentCommand.options.noOutput) {
            // DEBUG
            if (params) {
                console.log("RecievedCommand: ", params);
            } else {
                msg = msg.replace(/\\\\s/g, " ");
                console.log(msg);
            }
        }
    }

    recievedData(msg) {
        if (this.currentCommand.label === 'help') {
            process.stdout.write(msg);
            this.state = STATE.READY;
        } else if (this.currentCommand) {
            for (let line of msg.split(/\n/)) {
                line = line.trim();
                if (!line) {
                    continue;
                }
                const event = line.substr(0, line.indexOf(" "));

                let params;
                if (this.registeredHooks[event]) {
                    params = parseParams(line, 1, event.length + 1);
                } else {
                    params = parseParams(line, SHOULD_PARSE_PARAMS[this.currentCommand.label]);
                }

                if (VALID_HOOKS[event]) {
                    this.recievedEvent(params, event, line);
                } else {
                    this.recievedCommand(params, line);
                }
                if (!this.currentCommand.options.expectData || event !== "error") {
                    if (!this.currentCommand.failed || !this.currentCommand.options.mustReturnOK) {
                        this.currentCommand.resolve(params, event, line);
                    }
                }
            }
        }
    }

    init(rl) {
        this.connection.on('data', data => {
            // TeamSpeak always sends a "welcome" packet on established connection
            const msg = data.toString('utf8');

            if (this.state === STATE.INIT) {
                this.state = STATE.READY;
            } else {
                this.state = STATE.PROCESSING_DATA;
                const lines = msg.split(/\n\r/g);

                // Find event packet, should be the last packet/line in a message from the server
                const errorPacket = lines.filter(line => {
                    const event = line.substr(0, line.indexOf(" "));
                    return this.registeredHooks[event] !== undefined
                }).length;

                if (errorPacket) {
                    this.recievedData(this.buffer + msg);
                    this.buffer = "";
                } else {
                    this.buffer += msg;
                }
            }
            if (this.commandQueue.length === 0) {
                rl.prompt();
            } else {
                this.processQueue();
            }
        }).on('close', hadError => {
            this.state = STATE.CLOSED;
            if (hadError) {
                console.error("Error!");
            } else {
                console.info("Connection closed.");
            }
            clearInterval(this.pingTimer);
        });
    }

    processQueueItem(item) {
        if (typeof item === 'object') {
            item.command();
        } else {
            console.warn("Invalid cmd in queue", item);
        }
    }

    processQueue() {
        if (this.state !== STATE.READY) {
            return;
        }
        if (this.currentCommand.failed && this.currentCommand.options.mustReturnOK) {
            console.warn("Must complete previous command.");
        }
        if (this.commandQueue[0].length && (!this.currentCommand.failed || !this.currentCommand.options.mustReturnOK)) {
            // Process immediete queue, like commands from the CLI
            this.currentCommand = this.commandQueue[0].shift();
            this.processQueueItem(this.currentCommand);
        } else if (this.commandQueue[1].length) {
            // Task queue 1
            this.currentCommand = this.commandQueue[1].shift();
            this.processQueueItem(this.currentCommand);
        } else if (this.commandQueue[2].length) {
            // Task queue 2
            this.currentCommand = this.commandQueue[2].shift();
            this.processQueueItem(this.currentCommand);
        }
    }

    retryCommand() {
        this.processQueueItem(this.currentCommand);
    }

    skipCommand() {
        if (this.currentCommand.failed) {
            this.currentCommand = {};
            this.processQueue();
        }
    }

    clearCommandQueue() {
        this.commandQueue.splice(0, this.commandQueue.length);
    }

    getCommandQueue() {
        return this.commandQueue;
    }

    getCommand() {
        return this.currentCommand;
    }

    writeRaw(str) {
        this.state = STATE.AWAITING_DATA;
        // DEBUG
        if (!this.currentCommand.options.noOutput) {
            console.log("WRITE: " + str.replace("\r\n", "\\r\\n"));
        }
        this.connection.write(Buffer.from(str, 'utf8'));
    }

    writeToConnection(str) {
        this.writeRaw(str + "\r\n");
    }

    connected() {
        return this.state !== STATE.CLOSED;
    }

    addToCommandQueue(label, options, priority, command, resolve, reject) {
        if (this.commandQueue[priority].length) {
            console.log(`Items in queue(${priority}): ${this.commandQueue[priority].length}`);
        }
        this.commandQueue[priority].push({
            label,
            command,
            resolve,
            reject,
            options: {
                ...options
            },
        });
        this.processQueue();
    }

    send(cmd, args, options, priority = 0) {
        if (!cmd) {
            return;
        }
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
        return new Promise((resolve, reject) => {
            this.addToCommandQueue(cmd, options, priority, () => {
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
                let args = [`event=${event}`];
                if (typeof options === 'object') {
                    args.push(Object.entries(options).map(option => `${option[0]}=${option[1]}`));
                    if (options.id) {
                        event += options.id;
                    }
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
            if(Object.keys(this.registeredHooks[hook]).length === 0) {
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

module.exports = Connection;
