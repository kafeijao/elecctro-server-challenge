"use strict";

// Packages
const Joi = require('joi');
const data = require('./data.json');

// Joi schemas
const todoSchema = {
    id: Joi.string(),
    state: Joi.string().valid([data.todoState.COMPLETE, data.todoState.INCOMPLETE]),
    description: Joi.string(),
    dateAdded: Joi.date().iso(),
    stateFilter: Joi.string().valid([data.todoStateFilter.ALL, data.todoStateFilter.COMPLETE, data.todoStateFilter.INCOMPLETE]).default(data.todoStateFilter.ALL),
    orderBy: Joi.string().valid([data.orderByFilter.DATE_ADDED, data.orderByFilter.DESCRIPTION]).default(data.orderByFilter.DATE_ADDED)
};

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

            let todoList = await database.getAllEntries();

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

            return JSON.stringify(todoList);
        },
        options: {
            validate: {
                query: {
                    filter: todoSchema.stateFilter,
                    orderBy: todoSchema.orderBy,
                }
            }
        }
    };

    module.putTodo = {};

    module.patchTodo = {};

    module.deleteTodo = {};

    return module;
};
