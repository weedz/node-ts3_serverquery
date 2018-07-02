"use strict";
const readline = require('readline');

const config = require('./config.json');
const commands = require('./ts3/commands.json');

// commandline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: function(line) {
        const completions = Object.keys(commands);
        const hits = completions.filter((c) => c.startsWith(line));
        // show all completions if none found
        return [hits.length ? hits : completions, line];
    }
}).on('line', line => {
    const [cmd, ...args] = line.trim().split(" ");
    if (0 && !client.connected) {
        // Nothing..
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
const client = require('./ts3/Client')(rl, config);
