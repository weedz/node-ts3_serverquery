import fs from 'fs';
import Log from './Log.mjs';

// Broadcasted events from client
// connected() {}
// disconnected(hadError) {}
// init() {}
// reload() {}
// unload() {}
export default class Plugin {
    constructor(defaultConfig) {
        this.config = defaultConfig;
        this.connection = false;
        this.client = false;
    }
    load(connection, client) {
        this.connection = connection;
        this.client = client;
    }
    async loadConfig(configFile) {
        if (fs.existsSync(new URL(configFile))) {
            try {
                const newConfig = await import(configFile);
                if (newConfig.default) {
                    this.config = {
                        ...this.config,
                        ...newConfig.default
                    };
                }
            }
            catch (err) {
                Log(`Error reading config: ${err}`, 1);
            }
        } else {
            Log("Config not found", 2);
        }
    }
}
