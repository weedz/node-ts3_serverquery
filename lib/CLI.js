"use strict";
const readline = require('readline');
const commands = require('./commands.json');

module.exports = function(client, connection, config) {
    client.registerCommand('setup', client.setup.bind(client));
    client.registerCommand('retry', connection.retryCommand.bind(connection));
    client.registerCommand('skip', connection.skipCommand.bind(connection));
    client.registerCommand('clearqueue', connection.clearCommandQueue.bind(connection));
    client.registerCommand('viewqueue', client.viewqueue.bind(client));
    client.registerCommand('viewnext', client.viewnext.bind(client));
    client.registerCommand('listplugins', () => {
        const pluginsList = client.getPlugins();
        for (let plugin of Object.keys(pluginsList)) {
            console.log(`${plugin} (v${pluginsList[plugin].version}) - ${pluginsList[plugin].loaded ? "Loaded" : "Not loaded"}`);
        }
    });
    client.registerCommand('reloadplugins', client.reloadPlugins.bind(client));
    client.registerCommand('loadplugin', client.loadPlugin.bind(client));
    client.registerCommand('unloadplugin', client.unloadPlugin.bind(client));
    // commandline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
        completer: function(line) {
            let completions;
            if (connection.connected()) {
                completions = [...Object.keys(commands), ...Object.keys(client.commands)];
            } else {
                completions = [];
            }
            const hits = completions.filter((c) => c.startsWith(line));
            // show all completions if none found
            return [hits.length ? hits : completions, line];
        }
    });
    rl.on('line', line => {
        const [cmd, ...args] = line.trim().split(" ");
        if (!connection.connected()) {
            console.warn("You are disconnected.");
        } else {
            if (client.isCommand(cmd)) {
                client.executeCommand(cmd, args);
            } else if (cmd === 'help') {
                if (args.length === 1) {
                    client.showHelp(args[0]);
                } else {
                    client.showHelp();
                }
            } else if (cmd === 'login') {
                if (args.length === 2) {
                    client.login(args[0], args[1]);
                } else if (args.length === 0) {
                    client.login(config.auth.username, config.auth.password);
                } else {
                    console.warn("Needs 2 parameters: login <username> <password>");
                }
            } else {
                connection.send(cmd, args);
            }
        }
        rl.prompt();
    });
    return rl;
};
