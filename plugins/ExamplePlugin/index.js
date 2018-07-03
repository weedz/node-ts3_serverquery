module.exports = function(connection) {
    console.log("Hello world!");
    if (connection.connected()) {
        connection.send('use',[1], {mustReturnOK:true}, function(params) {
            connection.send('whoami', undefined, {mustReturnOK:true}, function(params) {
                console.log(params);
            })
        });
    } else {
        console.log('Not connected...');
    }
}
