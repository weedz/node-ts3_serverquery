import * as fs from 'fs';
import Log from './Log';
import Connection from './Connection';
import Client from './Client';

export default class Plugin {
    config: any;
    connection: Connection;
    client: Client;

    "init":Function;
    "connected":Function;
    "disconnected":Function;
    "reload":Function;
    "unload":Function;

    constructor(connection: Connection, client: Client) {
        this.connection = connection;
        this.client = client;
    }
}

export async function loadConfig(configFile: string) {
    const url = new URL("file://");
    url.pathname = configFile;
    if (fs.existsSync(url)) {
        try {
            return await import(configFile);
        } catch (err) {
            Log(`Error reading config: ${err}`, "PluginHelper", 1);
        }
    } else {
        Log("Config not found", "PluginHelper", 2);
    }
    return {};
}

export function mergeConfig<T>(c1: T, c2: T) {
    return Object.assign(c1, c2);
}
