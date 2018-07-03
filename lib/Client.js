"use strict";

module.exports = function(connection, config) {
    function sendCmd(cmd, args) {
        if (args !== undefined) {
            connection.send(cmd, args);
        } else {
            connection.send(cmd);
        }
    }
    function useServer(serverId) {
        if (connection.connected()) {
            sendCmd('use', [serverId]);
            sendCmd('clientupdate', [`client_nickname=${config.nickname.replace(/\s/g,"\\s")}`]);
        }
    }
    function showHelp(cmd) {
        sendCmd('help', cmd);
    }
    function login(username, password) {
        sendCmd('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }
    function autoSetup() {
        if (connection.connected()) {
            login(config.auth.username, config.auth.password);
            useServer(config.defaultServer);
        }
    }

    return {
        connected: connection.connected,
        sendCmd,
        useServer,
        showHelp,
        login,
        autoSetup
    };
};
