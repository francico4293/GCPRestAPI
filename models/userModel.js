'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { USERS } = require('../constants/datastoreConstants');

// create datastore client
const datastore = new Datastore();

/**
 * Creates a user with specified userId, givenName, and familyName. The newly created user is saved
 * to the Datastore Users kind.
 * @param {string} userId - The unique ID of the user.
 * @param {string} givenName - The given name of the user.
 * @param {string} familyName - The family name of the user.
 * @returns - The result of saving the user to the Datastore Users kind.
 */
const createUser = async (userId, givenName, familyName) => {
    // create key used to fetch user with userId
    const key = datastore.key([USERS, userId]);

    // create user entity
    const entity = { key, data: { givenName, familyName, aircrafts: 0 } };

    // save user entity to datastore
    return await datastore.save(entity);
}

/**
 * Fetches the user with userId from the Datastore Users kind.
 * @param {string} userId - The unique ID of the user.
 * @returns - A user object with id, givenName, familyName, and aircrafts attributes.
 */
const fetchUser = async (userId) => {
    // create key used to fetch user with userId
    const key = datastore.key([USERS, userId]);

    // get user from datastore
    const user = await datastore.get(key);

    // if null or undefined, then no user with userId exists
    if (user[0] == null || user[0] == undefined) {
        return null;
    }

    // return user object
    return {
        id: user[0][Datastore.KEY].name,
        givenName: user[0].givenName,
        familyName: user[0].familyName,
        aircrafts: user[0].aircrafts
    }
}

/**
 * Retrieves all users stored in the Datastore Users kind.
 * @returns - An array of user objects with attributes id, givenName, and familyName.
 */
const fetchAllUsers = async () => {
    // create query to fetch all user entities from datastore
    const query = datastore.createQuery(USERS);

    // run query and capture query results
    const queryResults = await datastore.runQuery(query);

    // return an array of user objects
    return queryResults[0].map(result => (
        { 
            id: result[Datastore.KEY].name,  
            givenName: result.givenName,
            familyName: result.familyName,
            aircrafts: result.aircrafts
        }
    ));
}

/**
 * Fetches the number of aircrafts owned by the user with userId.
 * @param {string} userId - The ID of the user. 
 * @returns - The number of aircrafts owned by the user with userId.
 */
const fetchNumberOfUserAircrafts = async (userId) => {
    // generate entity key used to fetch the user with userId
    const key = datastore.key([USERS, userId]);

    // fetch the entity using entity key
    const entity = await datastore.get(key);

    // return number of aircrafts owned by the user
    return entity[0].aircrafts;
}

/**
 * Increases the number of aircrafts owned by the user with userId by 1.
 * @param {string} userId - The ID of the user.
 * @returns - The result of saving the updated user entity to the Datastore Users kind.
 */
const incrementNumberOfUserAircrafts = async (userId) => {
    // generate entity key used to fetch the user with userId
    const key = datastore.key([USERS, userId]);

    // fetch the entity using entity key
    const entity = await datastore.get(key);

    // add 1 to the current number of aircrafts owned by the user
    entity[0].aircrafts = entity[0].aircrafts + 1;

    // save the updated user entity
    return await datastore.save(entity);
}

/**
 * Decreases the number of aircrafts owned by the user with userId by 1.
 * @param {string} userId - The ID of the user.
 * @returns - The result of saving the updated user entity to the Datastore Users kind.
 */
const decrementNumberOfUserAircrafts = async (userId) => {
    // generate entity key used to fetch the user with userId
    const key = datastore.key([USERS,userId]);

    // fetch the entity using entity key
    const entity = await datastore.get(key);

    // subtract 1 from the current number of aircrafts owned by the user
    entity[0].aircrafts = entity[0].aircrafts - 1;

    // save the updated user entity
    return await datastore.save(entity);
}

// exports
module.exports = { 
    createUser, 
    fetchUser, 
    fetchAllUsers ,
    fetchNumberOfUserAircrafts,
    incrementNumberOfUserAircrafts,
    decrementNumberOfUserAircrafts
};
