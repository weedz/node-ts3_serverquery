import * as fs from 'fs';
import Log from './Log.js';
import type Connection from './Connection.js';
import type Client from './Client.js';
import { PluginBase } from '@weedzcokie/plugin-loader';

export type PluginApi = {
    connection: Connection
    client: Client
}

export default abstract class Plugin extends PluginBase<PluginApi> {
    config: any;
    protected connection: Connection;
    protected client: Client;
    
    init?(): void;
    connected?(): void;
    disconnected?(): void;
    reload?(): void;
    unload?(): void;

    constructor(api: PluginApi, deps?: any) {
        super(api, deps);
        this.connection = api.connection;
        this.client = api.client;
    }
}

export async function loadConfig(configFile: string) {
    const url = new URL("file://");
    url.pathname = configFile;
    if (fs.existsSync(url)) {
        try {
            return await import(configFile, {assert: {type: "json"}});
        } catch (err) {
            Log(`Error reading config: ${err}`, "PluginHelper", 1);
        }
    } else {
        Log("Config not found", "PluginHelper", 2);
    }
    return {};
}

export function mergeConfig<T extends {}>(c1: T, c2: T) {
    return Object.assign(c1, c2);
}
