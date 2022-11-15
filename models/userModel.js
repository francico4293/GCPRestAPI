'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { USERS } = require('../constants/datastoreConstants');

// create datastore client
const datastore = new Datastore();

const createUser = async (userId, givenName, familyName) => {
    // create key used to fetch user with userId
    const key = datastore.key([USERS, userId]);

    // create user entity
    const entity = { key, data: { givenName, familyName } };

    // save user entity to datastore
    return await datastore.save(entity);
}

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

const fetchAllUsers = async () => {
    // create query to fetch all user entities from datastore
    const query = datastore.createQuery(USERS);

    // run query and capture query results
    const queryResults = await datastore.runQuery(query);

    // return an array of user objects
    return queryResults[0].map(result => ({ 
        id: result[Datastore.KEY].name,  
        givenName: result.givenName,
        familyName: result.familyName
    }));
}

// exports
module.exports = { 
    createUser, 
    fetchUser, 
    fetchAllUsers 
};
