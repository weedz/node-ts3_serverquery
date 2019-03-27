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
        while (!this.isEmpty()) {
            const command = this.shift();
            command && command.reject("CANCELLED");
        }
    }
}
