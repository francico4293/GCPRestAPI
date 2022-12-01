'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://canvas.oregonstate.edu/courses/1890665/pages/exploration-google-app-engine-and-node-dot-js?module_item_id=22486453
// SOURCE: https://canvas.oregonstate.edu/courses/1890665/pages/exploration-intermediate-rest-api-features-with-node-dot-js?module_item_id=22486462
// AUTHOR: Oregon State University
// DESCRIPTION: While developing the below functions, I referenced the above sources. These sources were explorations presented
//      throughout the duration of the CS493 course.

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment4/tree/main/models
// SOURCE: https://github.com/francico4293/CS493-Assignment5/tree/main/models
// AUTHOR: Colin Francis
// DESCRIPTION: While developing the below functions, I referenced my previous assignment submissions that were submitted this quarter for CS493. 
//      Source code can be provided upon request.

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
