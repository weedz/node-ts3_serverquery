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

        this.reloadPlugins();
    }
    broadcast(event, params) {
        for (let plugin of Object.values(this.plugins)) {
            this.notify(plugin, event, params);
        }
    }
    notify(plugin, event, params) {
        if (typeof plugin.plugin[event] === 'function') {
            plugin.plugin[event](params);
        }
    }
    getPlugins() {
        const plugins = {};
        for (let plugin of Object.keys(this.plugins)) {
            plugins[plugin] = {
                loaded: this.plugins[plugin].plugin !== false
            };
            if (this.plugins[plugin]) {
                plugins[plugin].version = this.plugins[plugin].version
            }
        }
        return plugins;
    }
    reloadPlugins() {
        for (let pluginName of Object.keys(this.config.plugins)) {
            if (this.config.plugins[pluginName]) {
                this.loadPlugin(pluginName);
            } else {
                this.plugins[pluginName] = false;
            }
        }
    }
    loadPlugin(pluginName) {
        if (!this.plugins[pluginName] || !this.plugins[pluginName].plugin) {
            const pluginPath = path.join(pluginsPath, pluginName);
            fs.stat(pluginPath).then(stats => {
                if (stats.isDirectory()) {
                    const plugin = require(pluginPath);
                    this.plugins[pluginName] = {
                        plugin: new plugin.plugin(),
                        version: plugin.VERSION
                    };
                    this.config.plugins[pluginName] = true;
                    if (this.connection.connected()) {
                        this.notify(this.plugins[pluginName], 'connected', this.connection);
                    }
                    console.log(`Plugin ${pluginName} loaded`);
                } else {
                    console.error(`Plugin ${pluginName} not found!`);
                }
            });
        } else {
            this.notify(this.plugins[pluginName], 'reload');
        }
    }
    unloadPlugin(pluginName) {
        if (this.plugins[pluginName]) {
            this.notify(this.plugins[pluginName], 'unload');
            this.plugins[pluginName].plugin = false;
        } else {
            console.error(`Plugin ${pluginName} not loaded`);
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
