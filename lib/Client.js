"use strict";

module.exports = function(connection, config) {
    function write(str) {
        connection.write(str);
    }
    function send(str) {
        connection.write(str + "\r\n");
    }
    function sendCmd(cmd, args) {
        connection.commandSent = cmd;
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
        return connection.connected();
    }
    function useServer(serverId) {
        if (connected()) {
            const commandQueue = [
                function() {
                    send(`use ${serverId}`)
                },
                function() {
                    send(`clientupdate client_nickname=${config.nickname.replace(/\s/,"\\s")}`);
                }
            ];
            connection.commandSent = 'useServer';
            connection.addToCommandQueue(commandQueue);
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
            const commandQueue = [
                function() {
                    login(config.auth.username, config.auth.password);
                },
                function() {
                    useServer(config.defaultServer);
                }
            ];
            connection.commandSent = "autosetup";
            connection.addToCommandQueue(commandQueue);
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
