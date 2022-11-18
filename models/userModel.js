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
    const entity = { key, data: { givenName, familyName } };

    // save user entity to datastore
    return await datastore.save(entity);
}

/**
 * Fetches the user with userId from the Datastore Users kind.
 * @param {string} userId - The unique ID of the user.
 * @returns - A user object with id, givenName, and familyName attributes.
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
        familyName: user[0].familyName
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
            familyName: result.familyName
        }
    ));
}

// exports
module.exports = { 
    createUser, 
    fetchUser, 
    fetchAllUsers 
};
