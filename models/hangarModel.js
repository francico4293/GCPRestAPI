'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { 
    HANGARS, 
    RESULT_LIMIT 
} = require('../constants/datastoreConstants');

// create new datastore client
const datastore = new Datastore();

const createHangar = async (name, location, capacity) => {
    const key = datastore.key(HANGARS);

    const entity = { key, data: { name, location, capacity, aircrafts: [] } };

    await datastore.save(entity);

    return parseInt(key.id);
}

const getQueryResultsForHangars = async (cursor) => {
    let query = datastore.createQuery(HANGARS).limit(RESULT_LIMIT);

    if (cursor !== null && cursor !== undefined) {
        query = query.start(cursor);
    }

    return await datastore.runQuery(query);
}

// exports
module.exports = { 
    createHangar, 
    getQueryResultsForHangars 
};
