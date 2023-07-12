import Log from "./Log.js";
import Connection from "./Connection.js";
import PluginLoader, { type PluginObject, NodeHandler } from "@weedzcokie/plugin-loader";
import kleur from "kleur";
import type { TS_whoami } from "./Types/TeamSpeak.js";
import type { BotConfig } from "./Types/Config.js";
import type Plugin from "./Plugin.js";

type AllowedPluginEvents = 
    |"init"
    |"connected"
    |"disconnected"
    |"reload"
    |"unload";

export default class Client {
    connection: Connection;
    plugins: Record<string, PluginObject<Plugin>> = {};
    config: BotConfig;
    commands: unknown = {};
    inited: boolean = false;
    // Should be {null} or something similar until we get whoami from server
    me: TS_whoami = {
        virtualserver_status: "",
        virtualserver_id: 0,
        virtualserver_unique_identifier: "",
        virtualserver_port: 0,
        client_id: 0,
        client_channel_id: 0,
        client_nickname: "",
        client_database_id: 0,
        client_login_name: "",
        client_unique_identifier: "",
        client_origin_server_id: 0
    };

    constructor(connection: Connection, config: BotConfig) {
        this.connection = connection;
        this.config = config;

        this.connection.socketOn("connect", _ => {
            this.broadcast("connected");
        });
        this.connection.socketOn("close", _hadError => {
            this.broadcast("disconnected");
        });

        const pluginsPath = new URL("../plugins", import.meta.url);

        PluginLoader<Plugin>(config.plugins, {
            api: {
                connection,
                client: this,
            },
            path: pluginsPath.pathname,
            log: str => (Log(str, 'PluginLoader', 3)),
            handlers: {
                default: NodeHandler
            }
        }).then(plugins => {
            this.plugins = plugins;
        });
    }
    getSelf() {
        return this.me;
    }
    // Handle plugins
    broadcast(event: AllowedPluginEvents, params?: any) {
        Log(`Broadcasting '${kleur.yellow(event)}'`, this.constructor.name, 5);
        for (const plugin of Object.values(this.plugins)) {
            this.notify(plugin.plugin, event, params);
        }
    }
    notify(plugin: any, event: AllowedPluginEvents, params?: any) {
        Log(`Sending notification '${kleur.yellow(event)}' to ${kleur.cyan(plugin.constructor.name)}`, this.constructor.name, 5);
        return new Promise<void>( (resolve, reject) => {
            let result = true;
            if (typeof plugin[event] === "function") {
                const pluginResponse = plugin[event](params);
                if (pluginResponse !== undefined) {
                    result = pluginResponse;
                }
            }
            if (result) {
                resolve();
            } else {
                reject(result);
            }
        })
    }
    getPluginsStatus() {
        const plugins: { [pluginName: string] : { loaded?:boolean, version?:string|number } } = {};
        for (let plugin in this.plugins) {
            plugins[plugin] = {
                loaded: true
            };
            plugins[plugin].version = this.plugins[plugin]?.manifest.version.toString();
        }
        return plugins;
    }

    showHelp(cmd?: string) {
        return this.connection.send("help", cmd);
    }

    login(username: string, password: string) {
        return this.connection.send('login', { client_login_name: username, client_login_password: password }, {
            noOutput: true
        });
    }

    init() {
        if (this.connection.connected()) {
            Log("Initializing...", this.constructor.name, 3);
            Promise.all([
                this.login(this.config.auth.username, this.config.auth.password),
                this.connection.send("use", this.config.defaultServer, {
                    noOutput: true
                }),
                this.connection.send("clientupdate", { client_nickname: this.config.nickname }, {
                    noOutput: true
                })
            ])
            .then(() => this.connection.send("whoami"))
            .then( (me) => {
                this.me = me;
                this.inited = true;
                Log("Init finished!", this.constructor.name, 3);
                this.broadcast('init');
            })
            .catch( (err: Error) => {
                Log(`Error in init: ${typeof err === "object" ? JSON.stringify(err) : err}`, this.constructor.name, 1);
            });
        } else {
            Log("Not connected", this.constructor.name, 2);
        }
    }
}
