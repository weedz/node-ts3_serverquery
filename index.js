"use strict";

const config = require('./config.json');
const Client = require('./lib/Client');
const Connection = require('./lib/Connection');

const connection = new Connection(config);
const client = new Client(connection, config);

const CLI = require('./lib/CLI')(client, connection, config);

connection.init(CLI);
