"use strict";
const readline = require('readline');
const commands = require('./commands.json');

module.exports = function(client, config) {
    // commandline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
        completer: function(line) {
            let completions;
            if (client.connected()) {
                completions = Object.keys(commands);
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
        if (!client.connected()) {
            console.warn("You are disconnected.");
        } else {
            if (cmd === 'help') {
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
            } else if (cmd === 'useserver') {
                client.useServer(1);
            } else if (cmd === 'autosetup') {
                client.autoSetup();
            } else {
                client.sendCmd(cmd, args);
            }
        }
        rl.prompt();
    });
    return rl;
};
