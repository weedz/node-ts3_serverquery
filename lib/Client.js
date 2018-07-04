"use strict";

const path = require('path');

module.exports = function (connection, config) {
    // Initialize plugins when connection is established
    const plugins = [];
    const pluginsPath = path.resolve('./plugins');
    for (let pluginName of Object.keys(config.plugins)) {
        const pluginPath = path.join(pluginsPath, pluginName);
        if (pluginPath) {
            const plugin = require(pluginPath);
            plugins.push(new plugin());
            console.log(`Plugin ${pluginName} loaded`);
        }
    }

    function broadcast(event, params) {
        for (let plugin of plugins) {
            if (typeof plugin[event] === 'function') {
                plugin[event](params);
            }
        }
    }
    connection.connection.on('connect', function () {
        broadcast('connected', connection);
    });

    function showHelp(cmd) {
        return connection.send('help', cmd);
    }

    function login(username, password) {
        return connection.send('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }

    function setup() {
        if (connection.connected()) {
            Promise.all([
                login(config.auth.username, config.auth.password),
                connection.send('use', [config.defaultServer]),
                connection.send('clientupdate', [`client_nickname=${config.nickname.replace(/\s/g,"\\s")}`])
            ]).then(function() {
                console.log(`Connected to server ${config.defaultServer}`);
                broadcast('setup');
            });
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
            setup,
            retry: connection.retryCommand,
            skip: connection.skipCommand,
            clearqueue: connection.clearCommandQueue,
            viewqueue,
            viewnext
        }
    };
};
