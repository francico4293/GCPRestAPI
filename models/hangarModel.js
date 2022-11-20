'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { 
    HANGARS, 
    RESULT_LIMIT 
} = require('../constants/datastoreConstants');

// create new datastore client
const datastore = new Datastore();

const createHangar = async (name, city, state, capacity) => {
    const key = datastore.key(HANGARS);

    const entity = { 
        key,
         data: { name, city, state, capacity, aircrafts: [] } 
    };

    await datastore.save(entity);

    return parseInt(key.id);
}

const getQueryResultsForHangars = async (cursor) => {
    let query = datastore.createQuery(HANGARS).limit(RESULT_LIMIT);

    if (cursor !== null && cursor !== undefined) {
        query = query.start(cursor);
    }

    return await datastore.runQuery(query);
}

const fetchHangarById = async (hangarId) => {
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    const entity = await datastore.get(key);

    if (entity[0] === null || entity[0] === undefined) {
        return null;
    }

    return {
        id: parseInt(entity[0][Datastore.KEY].id),
        name: entity[0].name,
        city: entity[0].city,
        state: entity[0].state,
        capacity: entity[0].capacity,
        aircrafts: entity[0].aircrafts
    };
}

const addAircraftToHangar = async (hangarId, aircraftId) => {
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    const entity = await datastore.get(key);

    entity[0].aircrafts.push(parseInt(aircraftId));

    return await datastore.save(entity);
}

const removeAircraftFromHangar = async (hangarId, aircraftId) => {
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    const entity = await datastore.get(key);

    entity[0].aircrafts = entity[0].aircrafts.filter(aircraft => aircraft !== parseInt(aircraftId));

    return await datastore.save(entity);
}

const deleteHangarById = async (hangarId) => {
    const key = datastore.key([HANGARS, datastore.int(hangarId)]);

    return await datastore.delete(key);
}

// exports
module.exports = { 
    createHangar, 
    getQueryResultsForHangars,
    fetchHangarById,
    addAircraftToHangar,
    removeAircraftFromHangar,
    deleteHangarById
};
