'use strict';

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
 * @returns - A raw query results object generated from querying the Datastore Aircrafts kind.
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

const updateAircraftHangar = async (aircraftId, hangarId) => {
    const key = datastore.key([AIRCRAFTS, datastore.int(aircraftId)]);

    const entity = await datastore.get(key);

    entity[0].hangar = parseInt(hangarId);

    return await datastore.save(entity);
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
    updateAircraftHangar,
    deleteAircraftById
};
