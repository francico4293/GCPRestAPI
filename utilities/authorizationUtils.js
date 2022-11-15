'use strict';

// imports
const { google } = require('googleapis');
const crypto = require('crypto');
const clientCredentialsJson = require('../client-credentials.json');
const { addStateToDatastore } = require('../models/stateModel');
const { 
    OFFLINE, 
    USER_INFO_PROFILE_SCOPE 
} = require('../constants/authorizationConstants');
const { 
    NUMBER_OF_RAND_BYTES, 
    HEX 
} = require('../constants/configConstants');

const getOauthClient = (isProd) => {
    const redirectUriIdx = isProd ? 1 : 0;

    return new google.auth.OAuth2(
        clientCredentialsJson.web.client_id,
        clientCredentialsJson.web.client_secret,
        clientCredentialsJson.web.redirect_uris[redirectUriIdx]
    );
}

const getAuthorizationUrl = async (isProd) => {
    const oauthClient = getOauthClient(isProd);

    const state = getState();

    await addStateToDatastore(state);

    return oauthClient.generateAuthUrl({
        access_type: OFFLINE,
        scope: USER_INFO_PROFILE_SCOPE,
        include_granted_scopes: true,
        state
    });
}

const getState = () => {
    return crypto.randomBytes(NUMBER_OF_RAND_BYTES).toString(HEX);
}

// exports
module.exports = { 
    getOauthClient, 
    getAuthorizationUrl 
};
