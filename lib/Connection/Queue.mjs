export default class Queue {
    constructor() {
        this.queue = [];
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    add(label, commandStr, command, resolve, reject, options) {
        this.queue.push({
            label,
            command,
            commandStr,
            resolve,
            reject,
            options: {
                ...options
            }
        });
    }

    shift() {
        return this.queue.shift();
    }

    empty() {
        this.queue.splice(0, this.queue.length);
    }
}
