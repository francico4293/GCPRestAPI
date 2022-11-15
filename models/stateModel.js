'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { STATES } = require('../constants/configConstants');

// create new datastore client
const datastore = new Datastore();

const addStateToDatastore = async (state) => {
    const key = datastore.key(STATES);

    const entity = { key, data: { state } };

    return await datastore.save(entity);
}

const fetchAllStates = async () => {
    const query = datastore.createQuery(STATES);

    const queryResults = await datastore.runQuery(query);

    return queryResults[0].map(result => result.state);
}

// exports
module.exports = { 
    addStateToDatastore, 
    fetchAllStates 
};
