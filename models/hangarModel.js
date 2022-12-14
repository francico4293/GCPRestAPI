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
const { 
    HANGARS, 
    RESULT_LIMIT 
} = require('../constants/datastoreConstants');

// create new datastore client
const datastore = new Datastore();

/**
 * Creates a new hangar entity and saves it to the Datastore Hangars kind.
 * @param {string} name - The name of the hangar.
 * @param {string} city - The city the hangar is located in.
 * @param {string} state - The state the hangar is located in.
 * @param {number} capacity - The maximum number of aircrafts that the hangar can hold.
 * @returns - The entity id of the newly create hangar
 */
const createHangar = async (name, city, state, capacity) => {
    // generate entity key
    const key = datastore.key(HANGARS);

    // create hangar entity
    const entity = { 
        key,
        data: { name, city, state, capacity, aircrafts: [] } 
    };

    // save hangar entity in Datastore Hangars kind
    await datastore.save(entity);

    // return entity id
    return parseInt(key.id);
}

/**
 * Queries Datastore Hangars kind for all hangars. If a cursor value is provided, the query will begin at 
 * the cursor position. The maximum number of hangars that will be returned is 5.
 * @param {string} cursor  - The location in the Datastore Aircrafts kind after the last result that was
 *      returned.
 * @returns - A raw query results object generated from querying the Datastore Hangars kind for no more than
 *      5 hangar entities.
 */
const getQueryResultsForHangars = async (cursor) => {
    // create query to fetch no more than 5 hangar entities from Datastore Hangars kind
    let query = datastore.createQuery(HANGARS).limit(RESULT_LIMIT);

    // start query from cursor if one is provided
    if (cursor !== null && cursor !== undefined) {
        query = query.start(cursor);
    }

    // return raw query results
    return await datastore.runQuery(query);
}

/**
 * Determines the total number of hangars.
 * @returns - The total number of hangars.
 */
const getTotalHangarsCount = async () => {
    // create query to fetch all hangars in Datastore Hangars kind
    const query = datastore.createQuery(HANGARS);

    // run query and capture results
    const queryResults = await datastore.runQuery(query);

    // return number of hangars in query results
    return queryResults[0].length;
}

/**
 * Retrieves the hangar entity with hangarId from the Datastore Hangars kind.
 * @param {string} hangarId - The ID of the hangar.
 * @returns - A hangar object with id, name, city, state, capacity, and aircrafts attributes.
 */
const fetchHangarById = async (hangarId) => {
    // generate entity key for hangar with hangarId
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    // fetch entity from Datastore Hangars kind using entity key
    const entity = await datastore.get(key);

    // if entity[0] is null or undefined then no hangar with hangarId exists
    if (entity[0] === null || entity[0] === undefined) {
        return null;
    }

    // return hangar object
    return {
        id: parseInt(entity[0][Datastore.KEY].id),
        name: entity[0].name,
        city: entity[0].city,
        state: entity[0].state,
        capacity: entity[0].capacity,
        aircrafts: entity[0].aircrafts
    };
}

/**
 * Adds a new aircraftId to the hangar entity with hangarId aircrafts array.
 * @param {string} hangarId - The ID of the hangar.
 * @param {string} aircraftId - The ID of the aircraft.
 * @returns - The result of saving the updated hangar entity to the Datastore Hangars kind.
 */
const addAircraftToHangar = async (hangarId, aircraftId) => {
    // generate entity key for hangar with hangarId
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    // fetch entity from Datastore Hangars kind using entity key
    const entity = await datastore.get(key);

    // add new aircraftId to aircrafts array for entity
    entity[0].aircrafts.push(parseInt(aircraftId));

    // save updated entity
    return await datastore.save(entity);
}

/**
 * Updates the attributes of the hangar with hangarId.
 * @param {string} hangarId - The ID of the hangar.
 * @param {object} updateObject - An object containing attributes that the hangar will be updated with.
 * @returns - An object representing the updated hangar with id, name, city, state, capacity, and aircrafts 
 *      attributes.
 */
const updateHangar = async (hangarId, updateObject) => {
    // generate entity key used to fetch the hangar with hangarId
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    // fetch the hangar using the key
    const entity = await datastore.get(key);

    // update hangar attribute values using value in update object
    Object.keys(updateObject).forEach(key => {
        if (Object.keys(entity[0]).includes(key)) {
            entity[0][key] = updateObject[key];
        }
    });

    // save updated hangar
    await datastore.save(entity);

    // return updated hangar object
    return {
        id: parseInt(entity[0][Datastore.KEY].id),
        name: entity[0].name,
        city: entity[0].city,
        state: entity[0].state,
        capacity: entity[0].capacity,
        aircrafts: entity[0].aircrafts
    };
}

/**
 * Removes the aircraftId from the hangar entity with hangarId aircrafts array.
 * @param {string} hangarId - The ID of the hangar.
 * @param {string} aircraftId - The ID of the aircraft.
 * @returns - The result of saving the updated hangar entity to the Datastore Hangars kind.
 */
const removeAircraftFromHangar = async (hangarId, aircraftId) => {
    // generate entity key for hangar with hangarId
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    // fetch entity from Datastore Hangars kind using entity key
    const entity = await datastore.get(key);

    // remove aircraftId from aircrafts array for entity
    entity[0].aircrafts = entity[0].aircrafts.filter(aircraft => aircraft !== parseInt(aircraftId));

    // save updated entity
    return await datastore.save(entity);
}

/**
 * Deletes the hangar entity with hangarId from the Datastore Hangars kind.
 * @param {string} hangarId - The ID of the hangar.
 * @returns - The result of deleting the hangar entity with hangarId from the Datastore Hangars kind.
 */
const deleteHangarById = async (hangarId) => {
    // generate entity key for hangar with hangarId
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    // delete entity from Datastore Hangars kind using entity key
    return await datastore.delete(key);
}

// exports
module.exports = { 
    createHangar, 
    getQueryResultsForHangars,
    getTotalHangarsCount,
    fetchHangarById,
    addAircraftToHangar,
    updateHangar,
    removeAircraftFromHangar,
    deleteHangarById
};
