"use strict";

// Packages
const Joi = require('joi');
const data = require('./data.json');


// Joi schemas
const inputSchema = {
    stateFilter: Joi.string().valid([data.todoStateFilter.ALL, data.todoStateFilter.COMPLETE, data.todoStateFilter.INCOMPLETE]).default(data.todoStateFilter.ALL),
    orderBy: Joi.string().valid([data.orderByFilter.DATE_ADDED, data.orderByFilter.DESCRIPTION]).default(data.orderByFilter.DATE_ADDED),
};

const todoStateSchema = Joi.string().valid([data.todoState.COMPLETE, data.todoState.INCOMPLETE]);

const todoSchema = Joi.object({
    id: Joi.string(),
    state: todoStateSchema,
    description: Joi.string(),
    dateAdded: Joi.date().iso()
});


// Util functions
/**
 * Compares two properties and returns -1, 0, 1 according if that property order.
 * @param a
 * @param b
 * @param prop
 * @returns {number}
 */
const compareNomNumberProperty = function(a, b, prop) {
    if (a[prop] < b[prop]) return -1;
    if (a[prop] > b[prop]) return 1;
    return 0;
};


/**
 * Initialize the routes with access to the server instance.
 * @param server
 */
module.exports = function (server) {

    const database = require('./database')(server, 'TodoList');

    module.getTodo = {
        method: 'GET',
        path: '/todos',
        handler: async (request, h) => {

            const filter = request.query.filter;
            const orderBy = request.query.orderBy;

            const userID = request.auth.credentials.name;

            let todoList = await database.getAllEntries(userID);

            // Filter the list
            if (filter !== data.todoStateFilter.ALL) {
                todoList = todoList.filter(entry => entry.state === filter);
            }

            // Order the list
            let propertyToOrderBy = 'dateAdded';
            if (orderBy === data.orderByFilter.DESCRIPTION) {
                propertyToOrderBy = "description";
            }
            todoList.sort((a, b) => compareNomNumberProperty(a, b, propertyToOrderBy));

            return todoList;
        },
        options: {
            validate: {
                query: {
                    filter: inputSchema.stateFilter,
                    orderBy: inputSchema.orderBy,
                }

            }, response: {
                schema: Joi.array().items(todoSchema)
            }
        }
    };

    module.putTodo = {
        method: 'PUT',
        path: '/todos',
        handler: async (request, h) => {

            const description = request.payload.description;
            const userID = request.auth.credentials.name;

            const newEntry = {
                state: data.todoState.INCOMPLETE,
                description: description,
                dateAdded: new Date()
            };

            return await database.insertEntry(newEntry, userID);
        },
        options: {
            validate: {
                payload: {
                    description: Joi.string().required()
                }

            }, response: {
                schema: todoSchema
            }
        }
    };

    module.patchTodo = {
        method: 'PATCH',
        path: '/todo/{id}',
        handler: async (request, h) => {

            const id = encodeURIComponent(request.params.id);

            const state = request.payload.state;
            const description = request.payload.description;
            const userID = request.auth.credentials.name;

            const entry = await database.getEntry(id, userID);

            let data = void 0;
            let code = 500;

            if (entry) {
                if (entry.state === require('./data.json').todoState.INCOMPLETE) {

                    if (state) {
                        entry.state = state;
                    }

                    if (description) {
                        entry.description = description;
                    }

                    data = await database.updateEntry(entry, userID);
                    code = 200;

                } else {
                    code = 400;
                }

            } else {
                code = 404;
            }

            return h.response(data).code(code);

        },
        options: {
            validate: {
                payload:
                    Joi.object().keys({
                        state: todoStateSchema,
                        description: Joi.string()
                    }).or('state', 'description'),

                params: {
                    id: Joi.string().guid({
                        version: ['uuidv4']
                    })
                }

            }, response: {
                schema: todoSchema
            }
        }
    };

    module.deleteTodo = {
        method: 'DELETE',
        path: '/todo/{id}',
        handler: async (request, h) => {

            const id = encodeURIComponent(request.params.id);
            const userID = request.auth.credentials.name;

            const entry = await database.getEntry(id, userID);

            let data = void 0;
            let code = 500;

            if (entry) {
                await database.deleteEntry(id, userID);
                code = 200;

            } else {
                code = 404;
            }

            return h.response(data).code(code);

        },
        options: {
            validate: {
                params: {
                    id: Joi.string().guid({
                        version: ['uuidv4']
                    })
                }

            }
        }
    };

    return module;
};
