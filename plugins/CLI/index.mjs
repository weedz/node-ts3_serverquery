import Plugin from '../../lib/Plugin';
import { createInterface } from 'readline';
import commands from './commands.json';

export const VERSION = 1;

export default class CLI extends Plugin {
    constructor() {
        super({});
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

        this.handleAutoCompletion = this.handleAutoCompletion.bind(this);
        this.onLine = this.onLine.bind(this);

        // commandline interface
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> ',
            completer: this.handleAutoCompletion
        })
        .on('line', this.onLine);
    }

    handleAutoCompletion(line) {
        line = line.split(" ");
        const completions = this.connection.connected()
            ? Object.keys(commands).concat(Object.keys(this.commands))
            : [];
        const hits = completions.filter(c => c.startsWith(line[0]));

        if (commands[line[0]]) {
            this.autoCompleteCommand(commands[line[0]]);
        }

        // show all completions if none found
        return [hits.length ? hits : completions, line[0]];
    }

    autoCompleteCommand(cmd) {
        process.stdout.write(`\nDescription: ${cmd.description}\n`);
        if (cmd.params) {
            process.stdout.write(`Params:\n`);
            for (let param of cmd.params) {
                process.stdout.write(`\t${param.key} = ${param.value}`);
            }
            process.stdout.write("\n");
        }
    }

    async onLine(line) {
        const [cmd, ...args] = line.trim().split(" ");
        if (!this.connection.connected()) {
            const status = this.connection.connecting() ? "Connecting" : "Disconnected";
            console.log(`Status: ${status}`);
        } else {
            if (this.isCommand(cmd)) {
                await this.executeCommand(cmd, args);
            } else if (cmd === 'help') {
                this.handleHelpCommand(args)
            } else if (cmd === 'login') {
                this.handleLoginCommand(args);
            } else {
                this.sendCommand(cmd, args);
            }
        }
        this.rl.prompt();
    }

    async handleHelpCommand(args) {
        if (args.length === 1) {
            await this.client.showHelp(args[0]);
        } else {
            await this.client.showHelp();
        }
    }

    async handleLoginCommand(args) {
        if (args.length === 2) {
            await this.client.login(args[0], args[1]);
        } else {
            console.warn("Needs 2 parameters: login <username> <password>");
        }
    }

    async sendCommand(cmd, args) {
        try {
            const param = await this.connection.send(cmd, args);
            console.log("Result:", param);
        } catch(err) {
            console.warn("Error: ", err);
        }
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
        return false;
    }
}
