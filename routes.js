"use strict";

/**
 * This route should list the to-do items on the list
 */
exports.GETTodo = {
    method: 'GET',
    path: '/',
    handler: (request, h) => {

        return 'Hello, world!';
    }
};

exports.PUTTodo = {};

exports.PatchTodo = {};

exports.DeleteTodo = {};
