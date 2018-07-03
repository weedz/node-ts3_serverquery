"use strict";

module.exports = function(connection, config) {
    function showHelp(cmd) {
        connection.send('help', cmd);
    }
    function login(username, password) {
        connection.send('login', [`client_login_name=${username}`, `client_login_password=${password}`], {mustReturnOK: true});
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
            connection.send('use', [serverId]);
            connection.send('clientupdate', [`client_nickname=${config.nickname.replace(/\s/g,"\\s")}`]);
        }
    }

    return {
        connected: connection.connected,
        send: connection.send,
        showHelp,
        login,
        commands: {
            autosetup,
            useserver,
            retry: connection.retryCommand,
            skip: connection.skipCommand,
            clearqueue: connection.clearQueue
        }
    };
};
