"use strict";

const Joi = require('joi');
const Bcrypt = require('bcrypt');

const config = require('./config.json');


module.exports = function (server) {

    const databaseIndex = 'index';
    const database = require('./database')(server, 'Users');

    server.auth.strategy('session', 'cookie', {
        cookie: {
            name: 'sid',

            // Don't forget to change it to your own secret password!
            password: config.auth.encryptionKey,

            // For working via HTTP in localhost
            isSecure: config.auth.isSecure
        },

        validateFunc: async (request, session) => {

            const users = await database.getAllEntries(databaseIndex);
            const account = users.find((user) => (user.id === session.id));

            if (!account) {
                return {valid: false};
            }

            return {valid: true, credentials: account};
        }
    });

    server.auth.default('session');

    server.route({
        method: 'POST',
        path: '/login',
        handler: async (request, h) => {

            const {username, password} = request.payload;

            const users = await database.getAllEntries(databaseIndex);

            let account = users.find(user => user.name === username);

            if (account) {
                const isValid = await Bcrypt.compare(password, account.password);

                if (isValid) {
                    request.cookieAuth.set({id: account.id});
                    return h.response(void 0);
                }
            }

            return h.response(void 0).code(404);
        },
        options: {
            auth: {
                mode: 'try'
            },
            validate: {
                payload: {
                    username: Joi.string().alphanum().min(3).max(30).required(),
                    password: Joi.string().alphanum().min(3).max(30).required()
                }
            }, response: {
                schema: Joi.empty()
            }
        },
    });

    server.route({
        method: 'PUT',
        path: '/register',
        handler: async (request, h) => {

            const {username, password} = request.payload;

            const users = await database.getAllEntries(databaseIndex);
            let account = users.find(user => user.name === username);

            if (!account) {

                const hash = await Bcrypt.hashSync(password, config.auth.saltRounds);

                account = await database.insertEntry({name: username, password: hash}, databaseIndex);

                request.cookieAuth.set({id: account.id});
                return h.response(void 0).code(201);
            }

            return h.response(void 0).code(400);
        },
        options: {
            auth: {
                mode: 'try'
            },
            validate: {
                payload: {
                    username: Joi.string().alphanum().min(3).max(30).required(),
                    password: Joi.string().alphanum().min(3).max(30).required()
                }
            }, response: {
                schema: Joi.empty()
            }
        },
    });

    server.route({
        method: 'GET',
        path: '/logout',
        handler: (request, h) => {

            request.cookieAuth.clear();
            return h.response(void 0);
        }
    });

};
