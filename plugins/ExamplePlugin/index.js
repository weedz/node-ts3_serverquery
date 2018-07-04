class ExamplePlugin {
    constructor() {
        this.connection = false;
    }
    connected(connection) {
        this.connection = connection;
        Promise.all([
            this.connection.send('use', [1], {mustReturnOK: true, noOutput: true}),
            this.connection.send('whoami', undefined, {mustReturnOK: true, noOutput: true})
        ]).then(data => {
            console.log("ExamplePlugin - ", data);
        }).catch(data => {
            console.log("ExamplePlugin - Catch: ", data);
        });
    }
    setup() {
        console.log("We in there bois!");
        // get clientlist every 5 second
        const connection = this.connection;
        function fetchClientList() {
            connection.send('clientlist', undefined, {noOutput: true}, 2).then(data => {
                console.log(`ExamplePlugin - clients: ${data.length}`);
                setTimeout(fetchClientList, 5000);
            });
        }
        setTimeout(fetchClientList, 5000);
    }
}

module.exports = ExamplePlugin;
