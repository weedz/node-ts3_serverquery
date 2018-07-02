"use strict";
const net = require('net');

const STATE = {
    AWAITING_DATA: 0,
    READY: 1,
    PROCESSING_DATA: 2
};

module.exports = function(rl) {
    let state;
    let commandSent;
    const client = new net.createConnection({
        port: 10011,
        host: '127.0.0.1'
    }, function() {
        state = STATE.READY;
    });

    let commandQueue = [];

    function processQueue() {
        if (commandQueue.length && state === STATE.READY) {
            const nextCmd = commandQueue.shift();
            if (typeof nextCmd === 'function') {
                nextCmd();
            } else {
                console.warn("Invalid cmd in queue", nextCmd);
            }
        }
    }

    function write(str) {
        state = STATE.AWAITING_DATA;
        //console.log("WRITE: " + str);
        client.write(Buffer.from(str, 'utf8'));
    }

    return {
        connection: client,
        state: function() {
            return state;
        },
        commandSent,
        write,
        addToCommandQueue: function(newQueue) {
            commandQueue.push(...newQueue);
            processQueue();
        },
        connected: function() {
            return client.readable;
        },
        init: function(rl) {
            client.on('data', data => {
                state = STATE.PROCESSING_DATA;
                let msg = data.toString('utf8').replace(/\r/g,"");
                console.log("cmd: " + commandSent);
                if (commandSent === 'help') {
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
                if (hadError) {
                    console.error("Error!");
                } else {
                    console.info("Connection closed.");
                }
            });
        }
    };
}
