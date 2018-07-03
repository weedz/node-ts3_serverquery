"use strict";
const net = require('net');

const STATE = {
    CLOSED: 0,
    READY: 1,
    AWAITING_DATA: 2,
    PROCESSING_DATA: 3,
};

module.exports = function(rl) {
    let state = STATE.CLOSED;
    let currentCommand = {};
    const commandQueue = [];

    const client = new net.createConnection({
        port: 10011,
        host: '127.0.0.1'
    }, function() {
        state = STATE.READY;
    });

    function init(rl) {
        client.on('data', data => {
            state = STATE.PROCESSING_DATA;
            let msg = data.toString('utf8').replace(/\r/g,"");
            console.log("cmd: " + currentCommand.label);
            if (currentCommand.label === 'help') {
                process.stdout.write(msg + "\n");
            } else {
                msg = msg.replace(/\\\\s/g, " ");
                console.log(msg);
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

    function processQueue() {
        console.log("state: " + state, "commandqueue: " + commandQueue.length);
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
        console.log("WRITE: " + str);
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
        if (commandQueue.length) {
            console.log(`Items in command queue: ${commandQueue.length}`);
        }
        let str;
        if (typeof args === 'object') {
            str = `${cmd} ${args.join(" ")}\r\n`;
        } else {
            str = cmd;
        }
        addToCommandQueue(cmd, function() {
            writeToConnection(str);
        });
    }

    return {
        connection: client,
        send,
        write: writeToConnection,
        writeRaw,
        addToCommandQueue,
        connected,
        init
    };
}
