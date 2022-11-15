'use strict';

// imports
const { google } = require('googleapis');
const crypto = require('crypto');
const axios = require('axios');
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
    // determine which redirect uri to use based on production or development environment
    const redirectUriIdx = isProd ? 1 : 0;

    // configure and return OAuth 2.0 client
    return new google.auth.OAuth2(
        clientCredentialsJson.web.client_id,
        clientCredentialsJson.web.client_secret,
        clientCredentialsJson.web.redirect_uris[redirectUriIdx]
    );
}

const getAuthorizationUrl = async (isProd) => {
    // get OAuth 2.0 client
    const oauthClient = getOauthClient(isProd);

    // generate random secret phrase to use as state
    const state = getState();

    // add state value to datastore
    await addStateToDatastore(state);

    // configure and return url to redirect used to OAuth 2.0 endpoint
    return oauthClient.generateAuthUrl({
        access_type: OFFLINE,
        scope: USER_INFO_PROFILE_SCOPE,
        include_granted_scopes: true,
        state
    });
}

const getTokens = async (accessCode, isProd) => {
    // get OAuth 2.0 client
    const oauthClient = getOauthClient(isProd);

    // exchange access code for access token
    const { tokens } = await oauthClient.getToken(accessCode);

    // return tokens to calling function
    return tokens;
}

const getUserInfo = async (accessToken) => {
    // send request for user information using access token for authorization
    const response = await axios.get('https://people.googleapis.com/v1/people/me?personFields=names', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (response.status === 200) {
        // return user information from Google
        return response.data;
    }

    // return null if status code isn't 200
    return null;
}

const decodeIdToken = async (idToken, isProd) => {
    try {
        // get OAuth 2.0 client
        const oauthClient = getOauthClient(isProd);

        // verify id token is valid
        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: clientCredentialsJson.web.client_id
        });

        // return JSON web token
        return ticket.getPayload();
    } catch (err) {
        // return null for invalid id tokens
        return null;
    }
}

const getState = () => {
    // return random secret phrase
    return crypto.randomBytes(NUMBER_OF_RAND_BYTES).toString(HEX);
}

// exports
module.exports = { 
    getOauthClient, 
    getAuthorizationUrl,
    getTokens,
    getUserInfo,
    decodeIdToken
};
