import { createInterface } from 'readline';
import commands from './CLI/commands.json';

export default function(client, connection, config) {
    client.registerCommand('setup', client.setup.bind(client));
    client.registerCommand('queueretry', connection.retryCommand.bind(connection));
    client.registerCommand('queueskip', connection.skipCommand.bind(connection));
    client.registerCommand('queueclear', connection.clearCommandQueue.bind(connection));
    client.registerCommand('queuelast', () => {
        console.log(connection.getCommand().label, connection.getCommand().options);
    });
    client.registerCommand('pluginlist', () => {
        const pluginsList = client.getPlugins();
        for (let plugin of Object.keys(pluginsList)) {
            console.log(`${plugin} [v${pluginsList[plugin].version}] - ${pluginsList[plugin].loaded ? "Loaded" : "Not loaded"}`);
        }
    });
    client.registerCommand('pluginreload', client.reloadPlugins.bind(client));
    client.registerCommand('pluginload', client.loadPlugin.bind(client));
    client.registerCommand('pluginunload', client.unloadPlugin.bind(client));

    // parse commandline arguments
    const args = {};
    for (let argv of process.argv.splice(2)) {
        const [key, value] = argv.split("=");
        args[key] = value !== undefined ? value : true;
    }
    if (args['--setup']) {
        connection.connection.on('connect', () => {
            client.setup();
        });
    }
    // commandline interface
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
        completer: function(line) {
            line = line.split(" ");
            const completions = connection.connected()
                ? Object.keys(commands).concat(Object.keys(client.commands))
                : [];
            const hits = completions.filter(c => c.startsWith(line[0]));

            if (commands[line[0]]) {
                process.stdout.write(`\nDescription: ${commands[line[0]].description}\n`);
                if (commands[line[0]].params) {
                    process.stdout.write(`Params:\n`);
                    for (let param of commands[line[0]].params) {
                        process.stdout.write(`\t${param.key} = ${param.value}`);
                    }
                    process.stdout.write("\n");
                }
            }

            // show all completions if none found
            return [hits.length ? hits : completions, line[0]];
        }
    });
    rl.on('line', async line => {
        const [cmd, ...args] = line.trim().split(" ");
        if (!connection.connected()) {
            const status = connection.connecting() ? "Connecting" : "Disconnected";
            console.log(`Status: ${status}`);
        } else {
            if (client.isCommand(cmd)) {
                await client.executeCommand(cmd, args);
            } else if (cmd === 'help') {
                if (args.length === 1) {
                    await client.showHelp(args[0]);
                } else {
                    await client.showHelp();
                }
            } else if (cmd === 'login') {
                if (args.length === 2) {
                    await client.login(args[0], args[1]);
                } else if (args.length === 0) {
                    await client.login(config.auth.username, config.auth.password);
                } else {
                    console.warn("Needs 2 parameters: login <username> <password>");
                }
            } else {
                try {
                    const param = await connection.send(cmd, args);
                    console.log("Result:", param);
                } catch(err) {
                    console.warn("Errro: ", err);
                }
            }
        }
        rl.prompt();
    });
    return rl;
};
