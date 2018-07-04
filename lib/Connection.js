"use strict";
const net = require('net');

// constants
const STATE = {
    CLOSED: 0,
    READY: 1,
    AWAITING_DATA: 2,
    PROCESSING_DATA: 3,
    INIT: 4
};
const VALID_EVENTS = {
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

let state = STATE.CLOSED;
let currentCommand = {};
const commandQueue = [];
const registeredEvents = {};

const client = new net.createConnection({
    port: 10011,
    host: '127.0.0.1'
}, function () {
    state = STATE.INIT;
    registerHook('error', {
        error: function (params) {
            // DEBUG
            console.log("Error check: ", params);
            if (params.id !== '0') {
                currentCommand.failed = true;
                if (currentCommand.options.mustReturnOK) {
                    currentCommand.reject(params);
                }
            }
        }
    });
});

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

function recievedEvent(params, event, msg) {
    for (let callback of registeredEvents[event]) {
        callback(params);
    }
}

function recievedCommand(params, msg) {
    if (params) {
        // DEBUG
        console.log("RecievedCommand: ", params);
    } else {
        msg = msg.replace(/\\\\s/g, " ");
        console.log(msg);
    }
}

function recievedData(msg) {
    if (currentCommand.label === 'help') {
        process.stdout.write(msg + "\n");
    } else {
        // TODO: Cleanup this..
        for (let line of msg.split(/\n/g)) {
            line.trim();
            if (!line.length) {
                continue;
            }
            const event = line.substr(0, line.indexOf(" "));

            let params;
            if (registeredEvents[event]) {
                params = parseParams(line, 1, event.length + 1);
            } else {
                params = parseParams(line, SHOULD_PARSE_PARAMS[currentCommand.label]);
            }

            if (registeredEvents[event]) {
                recievedEvent(params, event, line);
            } else if (!currentCommand.options.noOutput) {
                recievedCommand(params, line);
            }
            if (!currentCommand.options.mustReturnOK || !currentCommand.failed) {
                currentCommand.resolve(params, event, line);
            }
        }
    }
}

function init(rl) {
    client.on('data', data => {
        // TeamSpeak always sends a "welcome" packet on established connection
        if (state !== STATE.INIT) {
            state = STATE.PROCESSING_DATA;

            recievedData(data.toString('utf8').replace(/\r/g, ""));
        }

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

function processQueueItem(item) {
    if (typeof item === 'object') {
        item.command();
    } else {
        console.warn("Invalid cmd in queue", item);
    }
}

function processQueue() {
    if (!currentCommand.failed || !currentCommand.options.mustReturnOK) {
        if (commandQueue.length && state === STATE.READY) {
            currentCommand = commandQueue.shift();
            processQueueItem(currentCommand);
        }
    } else {
        console.warn("Must complete previous command.");
    }
}

function retryCommand() {
    processQueueItem(currentCommand);
}

function skipCommand() {
    if (currentCommand.failed) {
        currentCommand = {};
        processQueue();
    }
}

function clearCommandQueue() {
    commandQueue.splice(0, commandQueue.length);
}

function getCommandQueue() {
    return commandQueue;
}

function getCommand() {
    return currentCommand;
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

function addToCommandQueue(label, options, command, resolve, reject) {
    commandQueue.push({
        label,
        command,
        resolve,
        reject,
        options: {
            ...options
        },
    });
    processQueue();
}

// TODO: implement send using promises
function send(cmd, args, options, callback) {
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
    return new Promise((resolve, reject) => {
        addToCommandQueue(cmd, options, function () {
            writeToConnection(str);
        }, resolve, reject);
    });
}

function registerHook(event, callbacks) {
    if (VALID_EVENTS[event]) {
        for (let hook of Object.keys(callbacks)) {
            if (VALID_EVENTS[event][hook]) {
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

module.exports = {
    init,
    connection: client,
    connected,
    writeRaw,
    write: writeToConnection,
    send,
    addToCommandQueue,
    retryCommand,
    skipCommand,
    clearCommandQueue,
    getCommandQueue,
    getCommand,
    registerHook,
    registerEvent
};
