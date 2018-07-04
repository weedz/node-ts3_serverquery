class ExamplePlugin {
    constructor() {
        this.connection = false;
    }
    connected(connection) {
        this.connection = connection;
        Promise.all([
            connection.send('use', [1], {mustReturnOK: true, noOutput: true}),
            connection.send('whoami', undefined, {mustReturnOK: true, noOutput: true})
        ]).then(data => {
            console.log("ExamplePlugin: ", data);
        }).catch(data => {
            console.log("ExamplePlugin catch: ", data);
        });
    }
    setup() {
        console.log("We in there bois!");
    }
}

module.exports = ExamplePlugin;
