import config from './config.json';
import Client from './lib/Client';
import Connection from './lib/Connection';
import CLI from './lib/CLI';

const connection = new Connection(config);
connection.init();
const client = new Client(connection, config);

CLI(client, connection, config);
