'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { AIRCRAFTS } = require('../constants/datastoreConstants');

// create datastore client
const datastore = new Datastore();

const createAircraft = async (make, model, length, ownerId) => {
    const key = datastore.key(AIRCRAFTS);

    const entity = { key, data: { make, model, length, hangar: null, ownerId } };

    await datastore.save(entity);

    return parseInt(key.id);
}

// exports
module.exports = { createAircraft };
