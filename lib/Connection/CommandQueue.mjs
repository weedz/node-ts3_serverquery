import Log from '../Log';
import Queue from './Queue';

export default class CommandQueue {
    constructor(connection) {
        this.commandQueue = {
            0: new Queue(),
            1: new Queue(),
            2: new Queue(),
        };
        this.currentCommand = false;
        this.connection = connection;
    }

    clearQueue(id) {
        if (this.commandQueue[id]) {
            this.commandQueue[id].empty();
        }
    }

    processQueue() {
        if (!this.connection.ready()) {
            return;
        }
        for (let queueNr = 0, totalQueues = Object.keys(this.commandQueue).length; queueNr < totalQueues; queueNr++) {
            if (!this.commandQueue[queueNr].isEmpty()) {
                this.processQueueItem(this.commandQueue[queueNr].shift());
                break;
            }
        }
    }

    processQueueItem(command) {
        if (typeof command === 'object') {
            this.currentCommand = command;
            Log(`Process command: ${command.commandStr}`, this.constructor.name, 5);
            this.currentCommand.command();
        } else {
            Log(`Invalid cmd in queue: ${JSON.stringify(command)}`, this.constructor.name, 2);
        }
    }

    add(label, commandStr, options, priority, command, resolve, reject) {
        if (priority >= 0 && priority < Object.keys(this.commandQueue).length) {
            if (this.commandQueue[priority].length) {
                Log(`Items in queue(${priority}): ${this.commandQueue[priority].length}`, this.constructor.name, 4);
            }
            this.commandQueue[priority].add(
                label,
                commandStr,
                command,
                resolve,
                reject,
                options
            );
            this.processQueue();
        } else {
            Log(`Invalid priority: ${priority}`, this.constructor.name, 2);
        }
    }

    getCommand() {
        return this.currentCommand;
    }
}
