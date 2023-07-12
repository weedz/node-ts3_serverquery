import Plugin from "../../lib/Plugin.js";
import { createInterface, Interface } from "readline";
import type { TSCommandList } from '../../lib/commands.js';

export default class CLI extends Plugin {
    commands: {[cmd:string]: any} = {};
    rl!: Interface;

    init() {
        this.registerCommand('init', null, () => {
            this.client.init();
        });
        this.registerCommand('connect', null, () => {
            if (!this.connection.connected()) {
                this.connection.reconnect(this.client.config);
            } else {
                console.log("Already connected...");
            }
        });
        this.registerCommand('disconnect', null, () => {
            if (this.connection.connected()) {
                this.connection.disconnect();
            } else {
                console.log("Already disconnected...");
            }
        });
        this.registerCommand('queueretry', null, () => {
            this.connection.retryCommand();
        });
        this.registerCommand('queueskip', null, () => {
            this.connection.skipCommand();
        });
        this.registerCommand('queueclear', null, () => {
            this.connection.clearCommandQueue();
        });
        this.registerCommand('queuelast', null, () => {
            const command = this.connection.getCommand();
            if (command) {
                console.log(command.label, command.options);
            }
        });
        this.registerCommand('pluginlist', null, () => {
            const pluginsList = this.client.getPluginsStatus();
            for (let plugin of Object.keys(pluginsList)) {
                console.log(plugin + (pluginsList[plugin].loaded ? ` [v${pluginsList[plugin].version}] - Loaded` : " Not loaded"));
            }
        });
        // TODO: re-implement..
        // this.registerCommand('pluginreload', null, () => {
        //     this.client.reloadPlugins();
        // });
        // this.registerCommand('pluginload', null, (plugin: string) => {
        //     this.client.loadPlugin(plugin);
        // });
        // this.registerCommand('pluginunload', null, (plugin: string) => {
        //     this.client.unloadPlugin(plugin);
        // });

        // commandline interface
        // this.rl = createInterface({
        //     input: process.stdin,
        //     output: process.stdout,
        //     prompt: '> ',
        //     // completer: this.handleAutoCompletion
        // })
        // .on('line', this.onLine);
    }

    handleAutoCompletion = (line: string) => {
        const words = line.split(" ");
        // TODO: fix autocompletion for TSCommands
        // const completions = this.connection.connected()
        //     ? Object.keys(CLICommands).concat(Object.keys(this.commands))
        //     : [];
        // const hits = completions.filter(c => c.startsWith(words[0]));

        // if (CLICommands && CLICommands[words[0]]) {
        //     this.autoCompleteCommand(CLICommands[words[0]]);
        // }

        // show all completions if none found
        // return [hits.length ? hits : completions, words[0]];
        return words;
    }

    autoCompleteCommand(cmd: any) {
        process.stdout.write(`\nDescription: ${cmd.description}\n`);
        if (cmd.params) {
            process.stdout.write(`Params:\n`);
            // TODO: Fix..
            // for (let param of cmd.params) {
            //     process.stdout.write(`\t${param.key} = ${param.value}`);
            // }
            process.stdout.write("\n");
        }
    }

    onLine = async (line: string) => {
        const [cmd, ...args] = line.trim().split(" ");
        if (this.isCommand(cmd)) {
            await this.executeCommand(cmd, args);
        } else if (cmd === 'help') {
            this.handleHelpCommand(args)
        } else if (cmd === 'login') {
            this.handleLoginCommand(args);
        } else {
            // TODO: runtime check to make sure cmd is a valid command
            this.sendCommand(cmd as any, args);
        }
        this.rl.prompt();
    }

    async handleHelpCommand(args: string[]) {
        if (args.length === 1) {
            await this.client.showHelp(args[0]);
        } else {
            await this.client.showHelp();
        }
    }

    async handleLoginCommand(args: string[]) {
        if (args.length === 2) {
            try {
                await this.client.login(args[0], args[1]);
            } catch (error) {
                console.warn(`Error: ${error}`);
            }
        } else {
            console.warn("Needs 2 parameters: login <username> <password>");
        }
    }

    async sendCommand(cmd: keyof TSCommandList, args?: any) {
        try {
            const param = await this.connection.send(cmd, args);
            console.log("Result:", param);
        } catch(err) {
            console.warn("Error: ", err);
        }
    }

    registerCommand(cmd: string, options: object|null, callback: Function) {
        if (!this.isCommand(cmd)) {
            this.commands[cmd] = {
                callback
            };
        }
    }
    isCommand(cmd: string) {
        return this.commands[cmd] !== undefined;
    }

    executeCommand(cmd: string, args: any) {
        const f = this.commands[cmd].callback;
        if (typeof f === "function") {
            // let me tell you; if we use `typeof f` and we get "function", one can assume f is a function
            const f = this.commands[cmd].callback as Function;
            return f(...args);
        }
        return false;
    }
}
