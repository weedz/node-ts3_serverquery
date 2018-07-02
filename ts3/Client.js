"use strict";
const net = require('net');

// Constants, structs
const STATE = {
    AWAITING_DATA: 0,
    READY: 1,
    PROCESSING_DATA: 2
};

module.exports = function(rl, config) {
    let commandSent;
    let state = 0;
    const commandQueue = [];

    const client = new net.createConnection({
        port: 10011,
        host: '127.0.0.1'
    }, function() {
        state = STATE.READY;
    });

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

    function processQueue() {
        if (commandQueue.length && state === STATE.READY) {
            const nextCmd = commandQueue.shift();
            console.log(nextCmd);
            if (nextCmd.type === 1) {
                send(nextCmd.cmd);
            } else if (nextCmd.type === 2) {
                sendCmd(nextCmd.cmd, nextCmd.args);
            } else if (nextCmd.type === 3) {
                nextCmd.callback();
            }
        }
    }

    function write(str) {
        state = STATE.AWAITING_DATA;
        console.log(str);
        client.write(Buffer.from(str, 'utf8'));
    }
    function send(str) {
        write(str + "\r\n");
    }
    function sendCmd(cmd, args) {
        commandSent = cmd;
        if (args !== undefined) {
            if (typeof args === 'object') {
                send(`${cmd} ${args.join(" ")}`);
            } else {
                send(`${cmd} ${args}`);
            }
        } else {
            send(cmd);
        }
    }
    function connected() {
        return client.readable;
    }
    function useServer(serverId) {
        if (connected()) {
            commandQueue.push({
                type: 1,
                cmd: `use ${serverId}`
            },{
                type: 1,
                cmd: `clientupdate client_nickname=${config.nickname.replace(/\s/,"\\s")}`
            });
            commandSent = 'useServer';
            processQueue();
        }
    }
    function showHelp(cmd) {
        sendCmd('help', cmd);
    }
    function login(username, password) {
        sendCmd('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }
    function autoSetup() {
        if (connected()) {
            commandQueue.push({
                type: 3,
                callback: function() {
                    login(config.auth.username, config.auth.password);
                }
            },{
                type: 3,
                callback: function() {
                    useServer(config.defaultServer);
                }
            });
            commandSent = "autosetup";
            processQueue();
        }
    }

    return {
        connected,
        write,
        send,
        sendCmd,
        useServer,
        showHelp,
        login,
        autoSetup
    };
};
