import Client from "./lib/Client.js";
import Connection from "./lib/Connection.js";
import type { BotConfig } from "./lib/Types/Config.js";

// parse commandline arguments
const args = new Map<string, boolean|string>();
for (let argv of process.argv.splice(2)) {
    const [key, value] = argv.split("=");
    args.set(key, value !== undefined ? value : true);
}

(async() => {
    let config: BotConfig = {
        "logLevel": 4,
        "auth": {
            "username": "serveradmin",
            "password": "wkQ8BcOQ",
            "host": "127.0.0.1",
            "port": 10011
        },
        "plugins": [
            "CLI",
            "IdleCheck"
        ],
        "defaultServer": 1,
        "nickname": "ServerQueryBois"
    };
    // if (args.has("--config")) {
    //     const configFile = args.get("--config");
    //     try {
    //         config = (await import(`./${configFile}`, {assert: {type: "json"}})).default;
    //     } catch (e) {
    //         console.error(`Cannot find config file '${configFile}'`);
    //         process.exit(1);
    //     }
    // } else {
    //     config = (await import("./config.json", {assert: {type: "json"}})).default;
    // }
    
    const connection = new Connection(config);
    const client = new Client(connection, config);
    
    if (args.get("--init")) {
        connection.socketOn("connect", () => {
            client.init();
        });
    }
})();
