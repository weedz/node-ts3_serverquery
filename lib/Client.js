"use strict";

module.exports = function(connection, config) {
    function sendCmd(cmd, args) {
        if (args !== undefined) {
            connection.send(cmd, args);
        } else {
            connection.send(cmd);
        }
    }
    function showHelp(cmd) {
        sendCmd('help', cmd);
    }
    function login(username, password) {
        sendCmd('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }

    function autosetup() {
        if (connection.connected()) {
            login(config.auth.username, config.auth.password);
            useserver(config.defaultServer);

            // register "plugins". for now, just some events
            connection.registerEvent('channel', {id: 1}, {
                notifyclientmoved: function(params) {
                    // DEBUG
                    console.log(params);
                }
            });
            connection.registerEvent('server', undefined, {
                notifyclientleftview: function(params) {
                    // DEBUG
                    console.log(params);
                },
                notifycliententerview: function(params) {
                    // DEBUG
                    console.log(params);
                }
            });
        }
    }
    function useserver(serverId) {
        if (connection.connected()) {
            sendCmd('use', [serverId]);
            sendCmd('clientupdate', [`client_nickname=${config.nickname.replace(/\s/g,"\\s")}`]);
        }
    }

    return {
        connected: connection.connected,
        sendCmd,
        showHelp,
        login,
        commands: {
            autosetup,
            useserver
        }
    };
};
