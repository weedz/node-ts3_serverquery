module.exports = function(connection) {
    console.log("Hello world!");
    if (connection.connected()) {
        Promise.all([
            connection.send('use', [1], {mustReturnOK: true, noOutput: true}),
            connection.send('whoami', undefined, {mustReturnOK: true, noOutput: true})
        ]).then(data => {
            console.log("ExamplePlugin: ", data);
        }).catch(data => {
            console.log("ExamplePlugin catch: ", data);
        });
    } else {
        console.log('Not connected...');
    }
}
