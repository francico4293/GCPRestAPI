'use strict';

// imports
const { Datastore } = require('@google-cloud/datastore');
const { USERS, USER_ID } = require('../constants/datastoreConstants');
const { EQUALS_SIGN } = require('../constants/commonConstants');

// create datastore client
const datastore = new Datastore();

const fetchUser = async (userId) => {
    const key = datastore.key([USERS, userId]);

    const user = await datastore.get(key);

    if (user[0] == null || user[0] == undefined) {
        return null;
    }

    return {
        id: user[0][Datastore.KEY].name,
        givenName: user[0].givenName,
        familyName: user[0].familyName
    }
}

const createUser = async (userId, givenName, familyName) => {
    const key = datastore.key([USERS, userId]);

    const entity = { key, data: { givenName, familyName } };

    return await datastore.save(entity);
}

// exports
module.exports = { fetchUser, createUser };
