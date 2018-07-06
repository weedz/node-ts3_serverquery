const VERSION = 1;

class ExamplePlugin {
    constructor() {
        this.connection = false;
        this.fetchTimeout;
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
        // get clientlist and info every 5 second

        const connection = this.connection;

        const fetchClientInfo = async () => {
            const clientList = await connection.store.fetchList('clientlist');
            console.log(`Clients: ${clientList.length}`);
            for (let client of clientList) {
                const data = await connection.store.fetchInfo('clientinfo', 'clid', client.clid);
                console.log(`ExamplePlugin - client (${client.clid}): ${data.client_nickname}`);
            }
            this.fetchTimeout = setTimeout(fetchClientInfo, 1000);
        }
        this.fetchTimeout = setTimeout(fetchClientInfo, 1000);
    }
    reload() {
        console.log("ExamplePlugin - Already loaded!");
    }
    unload() {
        console.log("ExamplePlugin - Unloading...");
        clearTimeout(this.fetchTimeout);
    }
}

module.exports = {
    plugin: ExamplePlugin,
    VERSION
};
