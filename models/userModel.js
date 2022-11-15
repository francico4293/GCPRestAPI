'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { USERS } = require('../constants/configConstants'); 

// create datastore client
const datastore = new Datastore();

const fetchUser = async (userId) => {
    const query = datastore.createQuery(USERS).filter('userId', '=', userId);

    const queryResults = await datastore.runQuery(query);

    if (queryResults[0].length === 0) {
        return null;
    }

    return {
        id: queryResults[0][0].userId,
        givenName: queryResults[0][0].givenName,
        familyName: queryResults[0][0].familyName
    };
}

const createUser = async (givenName, familyName, userId) => {
    const key = datastore.key(USERS);

    const entity = { key, data: { givenName, familyName, userId } };

    return await datastore.save(entity);
}

// exports
module.exports = { fetchUser, createUser };
