'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { HANGARS } = require('../constants/datastoreConstants');

// create new datastore client
const datastore = new Datastore();

const createHangar = async (name, location, capacity) => {
    const key = datastore.key(HANGARS);

    const entity = { key, data: { name, location, capacity, aircrafts: [] } };

    await datastore.save(entity);

    return parseInt(key.id);
}

// exports
module.exports = { createHangar };
