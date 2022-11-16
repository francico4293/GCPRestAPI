'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { AIRCRAFTS } = require('../constants/datastoreConstants');
const { OWNER_ID } = require('../constants/aircraftConstants');
const { EQUALS_SIGN } = require('../constants/commonConstants');
const { RESULT_LIMIT } = require('../constants/datastoreConstants');

// create datastore client
const datastore = new Datastore();

const createAircraft = async (make, model, length, ownerId) => {
    const key = datastore.key(AIRCRAFTS);

    const entity = { key, data: { make, model, length, hangar: null, ownerId } };

    await datastore.save(entity);

    return parseInt(key.id);
}

const getAircraftQueryResultsForOwner = async (ownerId, cursor) => {
    let query = datastore.createQuery(AIRCRAFTS)
        .filter(OWNER_ID, EQUALS_SIGN, ownerId)
        .limit(RESULT_LIMIT);

    if (cursor !== undefined && cursor !== null) {
        query = query.start(cursor);
    }

    return await datastore.runQuery(query);
}

// exports
module.exports = { 
    createAircraft, 
    getAircraftQueryResultsForOwner 
};
