"use strict";

import config from './config.json';
import Client from './lib/Client';
import Connection from './lib/Connection';
import CLI from './lib/CLI';

const connection = new Connection(config);
const client = new Client(connection, config);

const cli = CLI(client, connection, config);

connection.init(cli);
