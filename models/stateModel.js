'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { STATES } = require('../constants/datastoreConstants');

// create new datastore client
const datastore = new Datastore();

const addState = async (state) => {
    // create entity key
    const key = datastore.key(STATES);

    // create entity using key and state value as data
    const entity = { key, data: { state } };

    // save entity to datastore
    return await datastore.save(entity);
}

const fetchAllStates = async () => {
    // create query to extract all entities from States kind
    const query = datastore.createQuery(STATES);

    // run query and store query results
    const queryResults = await datastore.runQuery(query);

    // return array of state values stored in datastore
    return queryResults[0].map(result => result.state);
}

// exports
module.exports = { 
    addState, 
    fetchAllStates 
};
