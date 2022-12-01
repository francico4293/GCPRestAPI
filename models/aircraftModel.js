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
const { AIRCRAFTS } = require('../constants/datastoreConstants');
const { OWNER_ID } = require('../constants/aircraftConstants');
const { EQUALS_SIGN } = require('../constants/commonConstants');
const { RESULT_LIMIT } = require('../constants/datastoreConstants');

// create datastore client
const datastore = new Datastore();

/**
 * Creates an aircraft with specified make, model, wingspan, and ownerId. The newly created aircraft
 * is saved to the Datastore Aircrafts kind.
 * @param {string} make - The make of the aircraft.
 * @param {string} model - The model of the aircraft.
 * @param {number} wingspan - The wingspan of the aircraft. 
 * @param {string} ownerId - The ID of the aircraft's owner.
 * @returns - The unique Datastore entity key of the aircraft.
 */
const createAircraft = async (make, model, wingspan, ownerId) => {
    // generate unique entity key
    const key = datastore.key(AIRCRAFTS);

    // create aircraft entity
    const entity = { key, data: { make, model, wingspan, hangar: null, ownerId } };

    // save the entity to datastore
    await datastore.save(entity);

    // return unique entity key
    return parseInt(key.id);
}

/**
 * Queries Datastore Aircrafts kind for all aircrafts whose ownerId matches the specified ownerId. If a 
 * cursor value is provided, the query will begin at the cursor position. The maximum number of aircrafts
 * that will be returned is 5.
 * @param {string} ownerId - The ID of the owner of the aircrafts to query for.
 * @param {string} cursor - The location in the Datastore Aircrafts kind after the last result that was
 *      returned.
 * @returns - A raw query results object generated from querying the Datastore Aircrafts kind for no more
 *      than 5 aircraft entities.
 */
const getQueryResultsForAircraftsByOwner = async (ownerId, cursor) => {
    // create a query to fetch no more than 5 aircrafts from datastore whose ownerId equals the specified
    // ownerId
    let query = datastore.createQuery(AIRCRAFTS)
        .filter(OWNER_ID, EQUALS_SIGN, ownerId)
        .limit(RESULT_LIMIT);

    // if a cursor was provided, then start the query at the cursor
    if (cursor !== undefined && cursor !== null) {
        query = query.start(cursor);
    }

    // run the query and return the raw query results
    return await datastore.runQuery(query);
}

/**
 * Fetches the aircraft with aircraftId from the Datastore Aircrafts kind.
 * @param {string} aircraftId - The ID of the aircraft.
 * @returns - An aircraft object with id, make, model, wingspan, hangar, and ownerId attributes.
 */
const fetchAircraftById = async (aircraftId) => {
    // create entity key used to fetch the aircraft with aircraftId
    const key = datastore.key([AIRCRAFTS, datastore.int(aircraftId)]);

    // fetch the aircraft using the key
    const entity = await datastore.get(key);

    // an array with null or undefined at index 0 means no aircraft with aircraftId exists
    if (entity[0] === null || entity[0] === undefined) {
        return null;
    }

    // return aircraft object
    return {
        id: parseInt(entity[0][Datastore.KEY].id),
        make: entity[0].make,
        model: entity[0].model,
        wingspan: entity[0].wingspan,
        hangar: entity[0].hangar,
        ownerId: entity[0].ownerId
    };
}

/**
 * Updates the attributes of the aircraft with aircraftId.
 * @param {string} aircraftId - The ID of the aircraft.
 * @param {object} updateObject - An object containing attributes that the aircraft will be updated with.
 * @returns - An object representing the updated aircraft with id, make, model, wingspan, hangar, and ownerId 
 *      attributes.
 */
const updateAircraft = async (aircraftId, updateObject) => {
    // create entity key used to fetch the aircraft with aircraftId
    const key = datastore.key([AIRCRAFTS, datastore.int(aircraftId)]);

    // fetch the aircraft using the key
    const entity = await datastore.get(key);

    // update aircraft attribute values provided in update object
    Object.keys(updateObject).forEach(key => {
        if (Object.keys(entity[0]).includes(key)) {
            entity[0][key] = updateObject[key];
        }
    });

    // save updated aircraft
    await datastore.save(entity);

    // return updated aircraft object
    return {
        id: parseInt(entity[0][Datastore.KEY].id),
        make: entity[0].make,
        model: entity[0].model,
        wingspan: entity[0].wingspan,
        hangar: entity[0].hangar,
        ownerId: entity[0].ownerId
    };
}

/**
 * Deletes the aircraft with aircraftId from the Datastore Aircrafts kind.
 * @param {string} aircraftId - The ID of the aircraft.
 * @returns - The result of deleting the aircraft with aircraftId from the Datastore Aircrafts kind.
 */
const deleteAircraftById = async (aircraftId) => {
    // create entity key used to delete the aircraft with aircraftId
    const key = datastore.key([AIRCRAFTS, datastore.int(aircraftId)]);

    // delete the aircraft and return deletion results
    return await datastore.delete(key);
}

// exports
module.exports = { 
    createAircraft, 
    getQueryResultsForAircraftsByOwner,
    fetchAircraftById,
    updateAircraft,
    deleteAircraftById
};
