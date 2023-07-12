import Log from '../Log.js';
import Queue from './Queue.js';
import Connection, { type Command } from '../Connection.js';

export default class CommandQueue {
    currentCommand: Command;
    connection : Connection;
    commandQueue : Queue[];

    constructor(connection : Connection) {
        this.commandQueue = [
            new Queue(),
            new Queue(),
            new Queue()
        ];
        // dret..
        this.currentCommand = {
            label: '',
            commandStr: '',
            command: () => {},
            resolve: () => {},
            reject: () => {},
            options: {},
        };
        this.connection = connection;
    }

    clearQueue(id: number) {
        if (this.commandQueue[id]) {
            this.commandQueue[id].empty();
        }
    }

    processQueue() {
        if (!this.connection.connected()) {
            // Empty queue and reject all "ongoing" commands
            for (let i = 0; i < this.commandQueue.length; i++) {
                this.clearQueue(i);
            }
        } else if (!this.connection.ready()) {
            return;
        }
        for (let queue of this.commandQueue) {
            if (!queue.isEmpty()) {
                this.processQueueItem(queue.shift());
                break;
            }
        }
    }

    processQueueItem(command: Command|undefined) {
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

    getCommand() {
        return this.currentCommand;
    }
}
