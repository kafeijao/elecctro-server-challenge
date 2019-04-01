"use strict";

const uuid = require('uuid/v4');

module.exports = function (server, segment) {

    const fakeDatabase = server.cache({ segment: segment, expiresIn: 364 * 24 * 60 * 60 * 1000 });

    /**
     * Get all entries in the database.
     * @param userID
     */
    module.getAllEntries = async function (userID) {
        const index = await fakeDatabase.get(userID);

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
     * @param userID
     */
    module.getEntry = async function (id, userID) {
        const index = await fakeDatabase.get(userID);

        if (index) {
            for (const indexEntry of index) {
                const entry = await fakeDatabase.get(indexEntry);
                if (entry.id === id) {
                    return entry;
                }
            }
        }

        return void 0;
    };

    /**
     * Inserts an entry in the database associated with a specific userID.
     * @param entry
     * @param userID
     */
    module.insertEntry = async function (entry, userID) {
        entry.id = uuid();

        await fakeDatabase.set(entry.id, entry);

        // Add the new id to the userID index
        const index = await fakeDatabase.get(userID) || [];
        index.push(entry.id);
        await fakeDatabase.set(userID, index);

        return entry;
    };

    /**
     * Updates an entry in the database.
     * @param updatedEntry
     * @param userID
     */
    module.updateEntry = async function (updatedEntry, userID) {
        const oldEntry = await module.getEntry(updatedEntry.id, userID);

        if (oldEntry) {
            await fakeDatabase.set(updatedEntry.id, updatedEntry);
            return updatedEntry;

        } else {
            return void 0;
        }
    };

    /**
     * Deletes an entry from the database.
     * @param id
     * @param userID
     */
    module.deleteEntry = async function (id, userID) {
        const entry = await module.getEntry(id, userID);

        if (entry) {
            const oldIndex = await fakeDatabase.get(userID);

            // Replace using filter with indexOf to improve performance (less readable)
            const newIndex = oldIndex.filter(entry => entry !== id);
            await fakeDatabase.set(userID, newIndex);

            await fakeDatabase.drop(id);
        }
    };

    return module;
};
