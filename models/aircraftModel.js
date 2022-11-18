'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { AIRCRAFTS } = require('../constants/datastoreConstants');
const { OWNER_ID } = require('../constants/aircraftConstants');
const { EQUALS_SIGN } = require('../constants/commonConstants');
const { RESULT_LIMIT } = require('../constants/datastoreConstants');

// create datastore client
const datastore = new Datastore();

const createAircraft = async (make, model, wingspan, ownerId) => {
    const key = datastore.key(AIRCRAFTS);

    const entity = { key, data: { make, model, wingspan, hangar: null, ownerId } };

    await datastore.save(entity);

    return parseInt(key.id);
}

const getQueryResultsForAircraftsByOwner = async (ownerId, cursor) => {
    let query = datastore.createQuery(AIRCRAFTS)
        .filter(OWNER_ID, EQUALS_SIGN, ownerId)
        .limit(RESULT_LIMIT);

    if (cursor !== undefined && cursor !== null) {
        query = query.start(cursor);
    }

    return await datastore.runQuery(query);
}

const fetchAircraftById = async (aircraftId) => {
    const key = datastore.key([AIRCRAFTS, datastore.int(aircraftId)]);

    const entity = await datastore.get(key);

    if (entity[0] === null || entity[0] === undefined) {
        return null;
    }

    return {
        id: parseInt(entity[0][Datastore.KEY].id),
        make: entity[0].make,
        model: entity[0].model,
        wingspan: entity[0].wingspan,
        hangar: entity[0].hangar,
        ownerId: entity[0].ownerId
    };
}

const deleteAircraftById = async (aircraftId) => {
    const key = datastore.key([AIRCRAFTS, datastore.int(aircraftId)]);

    return await datastore.delete(key);
}

// exports
module.exports = { 
    createAircraft, 
    getQueryResultsForAircraftsByOwner,
    fetchAircraftById,
    deleteAircraftById
};
