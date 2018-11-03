import fs from 'fs';
import Log from './Log.mjs';

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
        configFile = configFile.replace("file://", "");
        try {
            await fs.promises.access(configFile);
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
        }
        catch (e) {
            Log("Config not found", 2);
        }
    }
    // Broadcasted events from client
    // connected() {}
    // disconnected(hadError) {}
    // init() {}
    // reload() {}
    // unload() {}
}
