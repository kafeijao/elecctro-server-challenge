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

    await server.start();
    console.log(`Server running at: ${server.info.uri}/todos`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
