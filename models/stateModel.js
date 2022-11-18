'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { STATES } = require('../constants/datastoreConstants');

// create new datastore client
const datastore = new Datastore();

/**
 * Saves the specified state value to the Datastore States kind.
 * @param {string} state - A random secret phrase used to help prevent XSRF attacks. 
 * @returns - The result of saving the state to the Datastore States kind.
 */
const addState = async (state) => {
    // create entity key
    const key = datastore.key(STATES);

    // create entity using key and state value as data
    const entity = { key, data: { state } };

    // save entity to datastore
    return await datastore.save(entity);
}

/**
 * Fetches all state values from the Datastore States kind.
 * @returns - An array containing the state values retrieved from the Datastore States kind.
 */
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
