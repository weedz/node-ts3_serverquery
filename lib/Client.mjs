"use strict";

import path from 'path';
import fs from 'fs';
const pluginsPath = path.resolve('./plugins');

export default class Client {
    constructor(connection, config) {
        this.connection = connection;
        this.connection.connection.on('connect', () => {
            this.broadcast('connected', this.connection);
        }).on('close', hadError => {
            this.broadcast('disconnected', hadError);
        });

        this.plugins = {};
        this.config = config;
        this.commands = {};
        this.inited = false;

        this.reloadPlugins();
    }
    // Handle plugins
    broadcast(event, params) {
        for (let plugin of Object.values(this.plugins).filter(plugin => plugin.loaded)) {
            this.notify(plugin, event, params);
        }
    }
    notify(plugin, event, params) {
        if (typeof plugin.plugin[event] === 'function') {
            plugin.plugin[event](params);
        }
    }
    getPluginsStatus() {
        const plugins = {};
        for (let plugin of Object.keys(this.plugins)) {
            plugins[plugin] = {
                loaded: this.plugins[plugin].loaded
            };
            if (this.plugins[plugin]) {
                plugins[plugin].version = this.plugins[plugin].version
            }
        }
        return plugins;
    }
    reloadPlugins() {
        for (let pluginName of Object.keys(this.config.plugins)) {
            if (this.config.plugins[pluginName] || (this.plugins[pluginName] && this.plugins[pluginName].loaded) ) {
                this.loadPlugin(pluginName);
            } else {
                this.plugins[pluginName] = {
                    loaded: false
                };
            }
        }
    }
    loadPlugin(pluginName) {
        if (!this.plugins[pluginName] || !this.plugins[pluginName].plugin) {
            const pluginPath = path.join(pluginsPath, pluginName);
            fs.promises.access(pluginPath).then(() => {
                this.initPlugin(pluginName, pluginPath);
            }).catch(() => {
                console.error(`Plugin ${pluginName} not found!`);
            });
        } else {
            this.notify(this.plugins[pluginName], 'reload');
        }
    }
    initPlugin(pluginName, pluginPath) {
        import(pluginPath).then(plugin => {
            this.plugins[pluginName] = {
                plugin: new plugin.default(),
                version: plugin.VERSION,
                loaded: true
            };
            this.config.plugins[pluginName] = true;
            if (this.connection.connected()) {
                this.notify(this.plugins[pluginName], 'connected', this.connection);
                if (this.inited) {
                    this.notify(this.plugins[pluginName], 'init');
                }
            }
            console.log(`Plugin ${pluginName} [v${this.plugins[pluginName].version}] loaded`);
        }).catch(err => {
            console.error(`Error loading plugin ${pluginName}: ${err}`);
        });
    }
    unloadPlugin(pluginName) {
        if (this.plugins[pluginName]) {
            this.notify(this.plugins[pluginName], 'unload');
            this.plugins[pluginName].plugin = false;
            this.plugins[pluginName].loaded = false;
        } else {
            console.error(`Plugin ${pluginName} not loaded`);
        }
    }
    // /Handle plugins

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
            return this.commands[cmd](...args);
        }
    }

    showHelp(cmd) {
        return this.connection.send('help', cmd);
    }

    login(username, password) {
        return this.connection.send('login', [`client_login_name=${username}`, `client_login_password=${password}`]);
    }

    init() {
        if (this.connection.connected()) {
            Promise.all([
                this.login(this.config.auth.username, this.config.auth.password),
                this.connection.send('use', [this.config.defaultServer]),
                this.connection.send('clientupdate', [`client_nickname=${this.config.nickname.replace(/\s/g,"\\s")}`])
            ]).then(() => {
                this.inited = true;
                console.log(`Connected to server ${this.config.defaultServer}`);
                this.broadcast('init');
            }).catch(err => {
                console.log("Error in init: ", err);
            });
        } else {
            console.warn("");
        }
    }
}
