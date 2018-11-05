import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import Log from './Log.mjs';
const pluginsPath = path.resolve('./plugins');

export default class Client {
    constructor(connection, config) {
        this.connection = connection;
        this.connection.connection.on('connect', () => {
            this.broadcast('connected');
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
        if (typeof plugin.class[event] === 'function') {
            plugin.class[event](params);
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
            if (this.config.plugins[pluginName] || (this.plugins[pluginName] && this.plugins[pluginName].loaded)) {
                this.loadPlugin(pluginName);
            } else {
                this.plugins[pluginName] = {
                    loaded: false
                };
            }
        }
    }
    loadPlugin(pluginName) {
        if (!this.plugins[pluginName] || !this.plugins[pluginName].class) {
            const pluginPath = path.join(pluginsPath, pluginName);
            fs.promises.access(pluginPath).then(() => {
                this.initPlugin(pluginName, pluginPath);
            }).catch(() => {
                Log(`Plugin ${pluginName} not found!`, this.constructor.name, 1);
            });
        } else {
            this.notify(this.plugins[pluginName], 'reload');
        }
    }
    initPlugin(pluginName, pluginPath) {
        const url = new URL('file://');
        url.pathname = `${pluginPath}/index.mjs`;
        import(url.href).then(plugin => {
            this.plugins[pluginName] = {
                class: new plugin.default(),
                version: plugin.VERSION,
                loaded: true
            };
            this.plugins[pluginName].class.load(this.connection, this);
            this.config.plugins[pluginName] = true;
            if (this.connection.connected()) {
                this.notify(this.plugins[pluginName], 'connected', this.connection);
                if (this.inited) {
                    this.notify(this.plugins[pluginName], 'init');
                }
            }
            Log(`Plugin ${chalk.green(pluginName)} [${this.plugins[pluginName].version}] loaded`, this.constructor.name);
        }).catch(err => {
            Log(`Error loading plugin ${pluginName}: ${err}`, this.constructor.name, 1);
        });
    }
    unloadPlugin(pluginName) {
        if (this.plugins[pluginName]) {
            this.notify(this.plugins[pluginName], 'unload');
            this.plugins[pluginName].class = false;
            this.plugins[pluginName].loaded = false;
        } else {
            Log(`Plugin ${pluginName} not loaded`, this.constructor.name, 1);
        }
    }
    // /Handle plugins
    createPluginHook(pluginName, hook, callback) {

    }
    createPluginEvent(pluginName, event, callback) {

    }
    registerPluginHook() {

    }
    registerPluginEvent() {

    }

    showHelp(cmd) {
        return this.connection.send('help', cmd);
    }

    login(username, password) {
        return this.connection.send('login', [`client_login_name=${username}`, `client_login_password=${password}`], {
            noOutput: true
        });
    }

    init() {
        if (this.connection.connected()) {
            Log("Initializing...", this.constructor.name, 3);
            Promise.all([
                this.login(this.config.auth.username, this.config.auth.password),
                this.connection.send('use', [this.config.defaultServer], {
                    noOutput: true
                }),
                this.connection.send('clientupdate', [`client_nickname=${this.config.nickname.replace(/\s/g,"\\s")}`], {
                    noOutput: true
                })
            ]).then(() => {
                this.inited = true;
                this.broadcast('init');
            }).catch(err => {
                Log(`Error in init: ${JSON.stringify(err)}`, this.constructor.name, 1);
            });
        } else {
            Log("Not connected", this.constructor.name, 2);
        }
    }
}
