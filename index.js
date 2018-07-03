"use strict";

const config = require('./config.json');

const Connection = require('./lib/Connection');

const Client = require('./lib/Client')(Connection, config);

const CLI = require('./lib/CLI')(Client, config);

Connection.init(CLI);
