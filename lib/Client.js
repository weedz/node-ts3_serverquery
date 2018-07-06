"use strict";

const path = require('path');
const fs = require('fs').promises;
const pluginsPath = path.resolve('./plugins');

class Client {
    constructor(connection, config) {
        this.connection = connection;
        this.connection.connection.on('connect', () => {
            this.broadcast('connected', this.connection);
        });

        // Initialize plugins when connection is established
        this.plugins = {};
        this.config = config;
        this.commands = {};

        this.registerCommand('setup', this.setup.bind(this));
        this.registerCommand('retry', this.connection.retryCommand.bind(this.connection));
        this.registerCommand('skip', this.connection.skipCommand.bind(this.connection));
        this.registerCommand('clearqueue', this.connection.clearCommandQueue.bind(this.connection));
        this.registerCommand('viewqueue', this.viewqueue.bind(this));
        this.registerCommand('viewnext', this.viewnext.bind(this));
        this.registerCommand('reloadplugins', this.reloadPlugins.bind(this));
        this.registerCommand('loadplugin', this.loadPlugin.bind(this));

        this.reloadPlugins();
    }
    broadcast(event, params) {
        for (let plugin of Object.values(this.plugins)) {
            this.notify(plugin, event, params);
        }
    }
    notify(plugin, event, params) {
        if (typeof plugin[event] === 'function') {
            plugin[event](params);
        }
    }
    reloadPlugins() {
        for (let pluginName of Object.keys(this.config.plugins)) {
            this.loadPlugin(pluginName);
        }
    }
    loadPlugin(pluginName) {
        if (!this.plugins[pluginName]) {
            const pluginPath = path.join(pluginsPath, pluginName);
            fs.access(pluginPath).then(() => {
                const plugin = require(pluginPath);
                this.plugins[pluginName] = new plugin();
                console.log(`Plugin ${pluginName} loaded`);
            }).catch(() => {
                console.error(`Plugin ${pluginName} not found!`);
            });
        } else {
            this.notify(this.plugins[pluginName], 'reload');
        }
    }

    registerCommand(cmd, callback) {
        if (!this.isCommand(cmd)) {
            this.commands[cmd] = callback;
        }
    }

    isCommand(cmd) {
        return this.commands[cmd] !== undefined;
    }

    executeCommand(cmd, args) {
        if (this.isCommand(cmd)) {
            this.commands[cmd](...args);
        }
    }

    showHelp(cmd) {
        return this.connection.send('help', cmd);
    }

    login(username, password) {
        return this.connection.send('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }

    setup() {
        if (this.connection.connected()) {
            Promise.all([
                this.login(this.config.auth.username, this.config.auth.password),
                this.connection.send('use', [this.config.defaultServer]),
                this.connection.send('clientupdate', [`client_nickname=${this.config.nickname.replace(/\s/g,"\\s")}`])
            ]).then(() => {
                console.log(`Connected to server ${this.config.defaultServer}`);
                this.broadcast('setup');
            });
        }
    }

    viewqueue() {
        const queue = this.connection.getCommandQueue();
        for (let i = 0; i < queue.length; i++) {
            process.stdout.write(`${i+1} - ${queue[i].label}, failed=${queue[i].failed || false} ${JSON.stringify(command.options)}\n`);
        }
    }

    viewnext() {
        const command = this.connection.getCommand();
        process.stdout.write(`${command.label}, failed=${command.failed || false} ${JSON.stringify(command.options)}\n`);
    }

    connected() {
        return this.connection.connected;
    }
}

module.exports = Client;
