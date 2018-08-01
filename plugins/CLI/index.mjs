import Plugin from '../../lib/Plugin';
import { createInterface } from 'readline';
import commands from './commands.json';

export const VERSION = 1;

export default class CLI extends Plugin {
    constructor() {
        super();
        this.commands = {};
        this.registerCommand('init', () => {
            this.client.init();
        });
        this.registerCommand('queueretry', () => {
            this.connection.retryCommand();
        });
        this.registerCommand('queueskip', () => {
            this.connection.skipCommand();
        });
        this.registerCommand('queueclear', () => {
            this.connection.clearCommandQueue();
        });
        this.registerCommand('queuelast', () => {
            console.log(this.connection.getCommand().label, this.connection.getCommand().options);
        });
        this.registerCommand('pluginlist', () => {
            const pluginsList = this.client.getPluginsStatus();
            for (let plugin of Object.keys(pluginsList)) {
                console.log(plugin + (pluginsList[plugin].loaded ? ` [v${pluginsList[plugin].version}] - Loaded` : " Not loaded"));
            }
        });
        this.registerCommand('pluginreload', () => {
            this.client.reloadPlugins();
        });
        this.registerCommand('pluginload', plugin => {
            this.client.loadPlugin(plugin);
        });
        this.registerCommand('pluginunload', plugin => {
            this.client.unloadPlugin(plugin);
        });

        // commandline interface
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> ',
            completer: line => {
                line = line.split(" ");
                const completions = this.connection.connected()
                    ? Object.keys(commands).concat(Object.keys(this.commands))
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
            if (!this.connection.connected()) {
                const status = this.connection.connecting() ? "Connecting" : "Disconnected";
                console.log(`Status: ${status}`);
            } else {
                if (this.isCommand(cmd)) {
                    await this.executeCommand(cmd, args);
                } else if (cmd === 'help') {
                    if (args.length === 1) {
                        await this.client.showHelp(args[0]);
                    } else {
                        await this.client.showHelp();
                    }
                } else if (cmd === 'login') {
                    if (args.length === 2) {
                        await this.client.login(args[0], args[1]);
                    } else {
                        console.warn("Needs 2 parameters: login <username> <password>");
                    }
                } else {
                    try {
                        const param = await this.connection.send(cmd, args);
                        console.log("Result:", param);
                    } catch(err) {
                        console.warn("Error: ", err);
                    }
                }
            }
            rl.prompt();
        });
    }
    init() {
        console.log("We in there bois!");
    }

    registerCommand(cmd, callback) {
        if (!this.isCommand(cmd)) {
            this.commands[cmd] = callback;
        }
    }
    isCommand(cmd) {
        return this.commands[cmd] !== undefined;
    }

    executeCommand(cmd, args) {
        if (this.isCommand(cmd)) {
            return this.commands[cmd](...args);
        }
    }
}
