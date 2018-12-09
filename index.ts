/// <reference path="config.d.ts" />

import * as config from "./config.json";
import Client from "./lib/Client";
import Connection from "./lib/Connection";

// const configBuffer = fs.readFileSync(path.resolve("./config.json")).toString();
// const config = JSON.parse(configBuffer);

const connection = new Connection(config);
const client = new Client(connection, config);

// parse commandline arguments
const args = {};
for (let argv of process.argv.splice(2)) {
    const [key, value] = argv.split("=");
    args[key] = value !== undefined ? value : true;
}
if (args["--init"]) {
    connection.connection.on("connect", () => {
        client.init();
    });
}
