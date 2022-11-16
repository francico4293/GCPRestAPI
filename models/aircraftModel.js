'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { AIRCRAFTS } = require('../constants/datastoreConstants');
const { OWNER_ID } = require('../constants/aircraftConstants');
const { EQUALS_SIGN } = require('../constants/commonConstants');

// create datastore client
const datastore = new Datastore();

const createAircraft = async (make, model, length, ownerId) => {
    const key = datastore.key(AIRCRAFTS);

    const entity = { key, data: { make, model, length, hangar: null, ownerId } };

    await datastore.save(entity);

    return parseInt(key.id);
}

const fetchAllBoatsForOwner = async (ownerId) => {
    const query = datastore.createQuery(AIRCRAFTS).filter(OWNER_ID, EQUALS_SIGN, ownerId);

    const queryResults = await datastore.runQuery(query);

    return queryResults[0].map(queryResult => (
        {
            id: parseInt(queryResult[Datastore.KEY].id),
            make: queryResult.make,
            model: queryResult.model,
            length: queryResult.length,
            ownerId: queryResult.ownerId
        }
    ));
}

// exports
module.exports = { 
    createAircraft, 
    fetchAllBoatsForOwner 
};
