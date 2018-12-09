import { Command } from "./Command";

export default class Queue {
    queue: Command[];
    constructor() {
        this.queue = [];
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    add(command: Command) {
        this.queue.push(command);
    }

    length() {
        return this.queue.length;
    }

    shift() {
        return this.queue.shift();
    }

    empty() {
        this.queue.splice(0, this.queue.length);
    }
}
