"use strict";

const fs = require('fs');
const path = require('path');

module.exports = function (connection, config) {
    // Initialize plugins when connection is established
    connection.connection.on('connect', function () {
        const pluginsPath = path.resolve('./plugins');
        for (let plugin of Object.keys(config.plugins)) {
            const pluginPath = path.join(pluginsPath, plugin);
            console.log(pluginPath);
            if (pluginPath) {
                plugin = require(pluginPath);
                if (typeof plugin === 'function') {
                    plugin(connection);
                }
            }
        }
    });

    function showHelp(cmd) {
        connection.send('help', cmd);
    }

    function login(username, password) {
        connection.send('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }

    function autosetup() {
        if (connection.connected()) {
            login(config.auth.username, config.auth.password);
            useserver(config.defaultServer);

            connection.registerEvent('channel', {
                id: 1
            }, {
                notifyclientmoved: function (params) {
                    // DEBUG
                    console.log(params);
                }
            });
            connection.registerEvent('server', undefined, {
                notifyclientleftview: function (params) {
                    // DEBUG
                    console.log(params);
                },
                notifycliententerview: function (params) {
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

    function viewqueue() {
        const queue = connection.getCommandQueue();
        for (let i = 0; i < queue.length; i++) {
            process.stdout.write(`${i+1} - ${queue[i].label}, failed=${queue[i].failed || false} ${JSON.stringify(command.options)}\n`);
        }
    }

    function viewnext() {
        const command = connection.getCommand();
        process.stdout.write(`${command.label}, failed=${command.failed || false} ${JSON.stringify(command.options)}\n`);
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
            clearqueue: connection.clearCommandQueue,
            viewqueue,
            viewnext
        }
    };
};
