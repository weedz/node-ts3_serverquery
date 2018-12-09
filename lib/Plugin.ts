import * as fs from 'fs';
import Log from './Log';
import Connection from './Connection';
import Client from './Client';

// Broadcasted events from client
// connected() {}
// disconnected(hadError) {}
// init() {}
// reload() {}
// unload() {}
export default class Plugin {
    config: any;
    connection: Connection | null;
    client: Client | null;

    constructor(defaultConfig: any) {
        this.config = defaultConfig;
        this.connection = null;
        this.client = null;
    }
    load(connection: Connection, client: Client) {
        this.connection = connection;
        this.client = client;
    }
    async loadConfig(configFile: string) {
        const url = new URL("file://");
        url.pathname = configFile;
        if (fs.existsSync(url)) {
            try {
                const newConfig = await import(configFile);
                if (newConfig) {
                    this.config = {
                        ...this.config,
                        ...newConfig
                    };
                }
            } catch (err) {
                Log(`Error reading config: ${err}`, this.constructor.name, 1);
            }
        } else {
            Log("Config not found", this.constructor.name, 2);
        }
    }
}
