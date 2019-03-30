"use strict";

const uuid = require('uuid/v4');

const indexKey = 'index';

module.exports = function (server, segment) {

    const fakeDatabase = server.cache({ segment: segment, expiresIn: 364 * 24 * 60 * 60 * 1000 });

    /**
     * Get all entries in the database.
     */
    module.getAllEntries = async function () {
        const index = await fakeDatabase.get(indexKey);

        const entries = [];

        if (index) {
            for (const indexEntry of index) {
                const entry = await fakeDatabase.get(indexEntry);
                entries.push(entry);
            }
        }

        return entries;
    };

    /**
     * Get a certain entry from the database.
     * @param id
     */
    module.getEntry = async function (id) {
        return await fakeDatabase.get(id);
    };

    /**
     * Inserts an entry in the database.
     * @param entry
     */
    module.insertEntry = async function (entry) {
        entry.id = uuid();

        await fakeDatabase.set(entry.id, entry);

        // Add the new id to the index
        const index = await fakeDatabase.get(indexKey) || [];
        index.push(entry.id);
        await fakeDatabase.set(indexKey, index);

        return entry;
    };

    /**
     * Updates an entry in the database.
     * @param updatedEntry
     */
    module.updateEntry = async function (updatedEntry) {
        await fakeDatabase.set(updatedEntry.id, updatedEntry);
        return updatedEntry;
    };

    /**
     * Deletes an entry from the database.
     * @param id
     */
    module.deleteEntry = async function (id) {
        const oldIndex = await fakeDatabase.get(indexKey);

        // Replace using filter with indexOf to improve performance (less readable)
        const newIndex = oldIndex.filter(entry => entry !== id);
        await fakeDatabase.set(indexKey, newIndex);

        await fakeDatabase.drop(id);
    };

    return module;
};
