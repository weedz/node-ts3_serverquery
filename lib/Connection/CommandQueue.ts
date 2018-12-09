import Log from '../Log';
import Queue from './Queue';
import Connection from '../Connection';
import { Command } from './Command';

export default class CommandQueue {
    currentCommand: null | Command;
    connection : Connection;
    commandQueue : Queue[];

    constructor(connection : Connection) {
        this.commandQueue = [
            new Queue(),
            new Queue(),
            new Queue()
        ];
        this.currentCommand = null;
        this.connection = connection;
    }

    clearQueue(id: number) {
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

    processQueueItem(command: Command) {
        if (typeof command === 'object') {
            this.currentCommand = command;
            Log(`Process command: ${command.commandStr}`, this.constructor.name, 5);
            this.currentCommand.command();
        } else {
            Log(`Invalid cmd in queue: ${JSON.stringify(command)}`, this.constructor.name, 2);
        }
    }

    add(command: Command, priority: number) {
        if (priority >= 0 && priority < Object.keys(this.commandQueue).length) {
            if (this.commandQueue[priority].length()) {
                Log(`Items in queue(${priority}): ${this.commandQueue[priority].length()}`, this.constructor.name, 4);
            }
            this.commandQueue[priority].add(command);
            this.processQueue();
        } else {
            Log(`Invalid priority: ${priority}`, this.constructor.name, 2);
        }
    }

    getCommand(): Command {
        return this.currentCommand;
    }
}
