"use strict";
const net = require('net');

// constants
const STATE = {
    CLOSED: 0,
    READY: 1,
    AWAITING_DATA: 2,
    PROCESSING_DATA: 3,
};
const VALID_REGISTER = {
    error: {
        error: 1
    },
    server: {
        notifyclientleftview: 1,
        notifycliententerview: 1,
        notifyserveredited: 1,
    },
    channel: {
        notifyclientmoved: 1,
        notifyclientleftview: 1,
        notifycliententerview: 1,
        notifychanneledited: 1,
        notifychanneldeleted: 1
    },
    textserver: {
        notifytextmessage: 1,
    },
    textchannel: {
        notifytextmessage: 1,
    },
    textprivate: {
        notifytextmessage: 1,
    },
};
const VALID_EVENT = {
    error: 1,
    notifytextmessage: 1,
    notifyclientmoved: 1,
    notifyclientleftview: 1,
    notifycliententerview: 1
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

module.exports = function(rl) {
    let state = STATE.CLOSED;
    let currentCommand = {};
    const commandQueue = [];
    const registeredEvents = {};

    const client = new net.createConnection({
        port: 10011,
        host: '127.0.0.1'
    }, function() {
        state = STATE.READY;
        registerHook('error', {
            error: function(params) {
                // DEBUG
                console.log(params);
            }
        });
    });

    function parseParams(msg, type, start = 0) {
        const params = {};
        if (type === 2) {
            return msg.split(/\|/g).map(item => parseParams(item));
        }
        for(let param of msg.substr(start).trim().split(" ").map(param => param.split("="))) {
            params[param[0]] = param[1];
        }
        return params;
    }

    function recievedEvent(event, msg) {
        if (registeredEvents[event]) {
            const params = parseParams(msg, 1, event.length+1);
            for (let callback of registeredEvents[event]) {
                callback(params);
            }
        }
    }

    function recievedCommand(msg) {
        if (SHOULD_PARSE_PARAMS[currentCommand.label]) {
            const params = parseParams(msg, SHOULD_PARSE_PARAMS[currentCommand.label]);
            // DEBUG
            console.log(params);
        } else {
            msg = msg.replace(/\\\\s/g, " ");
            console.log(msg);
        }
    }

    function recievedData(msg) {
        if (currentCommand.label === 'help') {
            process.stdout.write(msg + "\n");
        } else {
            for(let line of msg.split(/\n/g)) {
                line.trim();
                if (!line.length) {
                    continue;
                }
                const event = line.substr(0, line.indexOf(" "));

                if (VALID_EVENT[event] && registeredEvents[event]) {
                    recievedEvent(event, line);
                } else {
                    recievedCommand(line);
                }
            }
        }
    }

    function init(rl) {
        client.on('data', data => {
            state = STATE.PROCESSING_DATA;

            recievedData(data.toString('utf8').replace(/\r/g,""));

            state = STATE.READY;
            if (commandQueue.length === 0) {
                rl.prompt();
            } else {
                processQueue();
            }
        }).on('close', hadError => {
            state = STATE.CLOSED;
            if (hadError) {
                console.error("Error!");
            } else {
                console.info("Connection closed.");
            }
        });
    }

    function processQueue() {
        if (commandQueue.length && state === STATE.READY) {
            currentCommand = commandQueue.shift();
            if (typeof currentCommand === 'function') {
                currentCommand();
            } else if (typeof currentCommand === 'object') {
                currentCommand.callback();
            } else {
                console.warn("Invalid cmd in queue", currentCommand);
            }
        }
    }

    function writeRaw(str) {
        state = STATE.AWAITING_DATA;
        // DEBUG
        console.log("WRITE: " + str.replace("\r\n", "\\r\\n"));
        client.write(Buffer.from(str, 'utf8'));
    }

    function writeToConnection(str) {
        writeRaw(str + "\r\n");
    }

    function connected() {
        return state !== STATE.CLOSED;
    }

    function addToCommandQueue(label, callback) {
        commandQueue.push({
            label,
            callback
        });
        processQueue();
    }

    function send(cmd, args) {
        if (!cmd) {
            return;
        }
        if (commandQueue.length) {
            console.log(`Items in command queue: ${commandQueue.length}`);
        }
        let str;
        if (typeof args === 'object') {
            str = `${cmd} ${args.join(" ")}`;
        } else if (typeof args === 'string') {
            str = `${cmd} ${args}`;
        } else {
            str = cmd;
        }
        addToCommandQueue(cmd, function() {
            writeToConnection(str);
        });
    }

    function registerHook(event, callbacks) {
        if (VALID_REGISTER[event]) {
            for(let hook of Object.keys(callbacks)) {
                if (VALID_REGISTER[event][hook]) {
                    if (registeredEvents[hook] === undefined) {
                        registeredEvents[hook] = [];
                    }
                    registeredEvents[hook].push(callbacks[hook]);
                } else {
                    console.error(`Invalid hook: ${hook}, event: ${event}`);
                    return false;
                }
            }
        }
        return true;
    }

    function registerEvent(event, options, callbacks) {
        let valid = registerHook(event, callbacks);
        if (valid) {
            let args = [`event=${event}`];
            if (typeof options === 'object') {
                args.push(Object.entries(options).map(option => `${option[0]}=${option[1]}`));
            }
            send('servernotifyregister', args);
        }
    }

    return {
        init,
        connection: client,
        send,
        write: writeToConnection,
        writeRaw,
        addToCommandQueue,
        connected,
        registerHook,
        registerEvent
    };
}
