"use strict";

// Packages
const Hapi = require('hapi');

// Project Files
const config = require('./config.json');
const routes = require('./routes');



const server = Hapi.server({
    port: config.server.port,
    host: config.server.host
});


// Routes
server.route(routes.GETTodo);

const init = async () => {

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
