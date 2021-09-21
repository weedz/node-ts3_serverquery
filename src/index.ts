import Client from "./lib/Client";
import Connection from "./lib/Connection";

// parse commandline arguments
const args = new Map<string, boolean|string>();
for (let argv of process.argv.splice(2)) {
    const [key, value] = argv.split("=");
    args.set(key, value !== undefined ? value : true);
}

(async() => {
    let config;
    if (args.has("--config")) {
        const configFile = args.get("--config");
        try {
            config = (await import(`./${configFile}`)).default;
        } catch (e) {
            console.error(`Cannot find config file '${configFile}'`);
            process.exit(1);
        }
    } else {
        config = (await import("./config.json")).default;
    }
    
    const connection = new Connection(config);
    const client = new Client(connection, config);
    
    if (args.get("--init")) {
        connection.socketOn("connect", () => {
            client.init();
        });
    }
})();
