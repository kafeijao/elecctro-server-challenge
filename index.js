"use strict";

// Packages
const Hapi = require('hapi');

// Project Files
const config = require('./config.json');


// Hapi server settings
const hapiOptions = {
    port: config.server.port,
    host: config.server.host
};

if (config.server.debugMode) {
    hapiOptions.debug = { request: ['error'] };
}
const server = Hapi.server(hapiOptions);

// Routes
const routes = require('./routes')(server);
server.route(routes.getTodo);
server.route(routes.putTodo);
server.route(routes.patchTodo);
server.route(routes.deleteTodo);

const init = async () => {
    // Initialize lout
    await server.register([require('vision'), require('inert'), require('lout')]);
    console.log(`Documentation running at: ${server.info.uri}/docs`);

    // Initialize server
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
