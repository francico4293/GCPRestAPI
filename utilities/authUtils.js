'use strict';

// imports
const { google } = require('googleapis');
const crypto = require('crypto');
const axios = require('axios');
const clientCredentialsJson = require('../client-credentials.json');
const { addState } = require('../models/stateModel');
const { 
    OFFLINE, 
    USER_INFO_PROFILE_SCOPE,
    NUMBER_OF_RAND_BYTES,
    HEX 
} = require('../constants/authorizationConstants');

/**
 * Generates a new Oauth 2.0 client.
 * @param {boolean} isProd - True if the application is running in production. Otherwise, false.
 * @returns - An OAuth 2.0 client configured based on the client credentials for the application provided
 *      by Google Cloud Platform.
 */
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

/**
 * Generates the authorization URL used to redirect the end-user to the Google OAuth 2.0 endpoint.
 * @param {boolean} isProd - True if the application is running in production. Otherwise, false. 
 * @returns - The URL used to redirect an end-user to the Google OAuth 2.0 endpoint.
 */
const getAuthorizationUrl = async (isProd) => {
    // get OAuth 2.0 client
    const oauthClient = getOauthClient(isProd);

    // generate random secret phrase to use as state
    const state = getState();

    // add state value to datastore
    await addState(state);

    // configure and return url to redirect used to OAuth 2.0 endpoint
    return oauthClient.generateAuthUrl({
        access_type: OFFLINE,
        scope: USER_INFO_PROFILE_SCOPE,
        include_granted_scopes: true,
        state
    });
}

/**
 * Used to exchange the access code given to the end-user by the Google OAuth 2.0 authorization endpoint for
 * a tokens object containing an id_token and an access_token.
 * @param {string} accessCode - The access code provided by the Google OAuth 2.0 authorization endpoint.
 * @param {boolean} isProd - True if the application is running in production. Otherwise, false.
 * @returns - A tokens object provided by Google in exchange for the access code given to the end-user by the
 *      Google OAuth 2.0 authorization endpoint.
 */
const getTokens = async (accessCode, isProd) => {
    // get OAuth 2.0 client
    const oauthClient = getOauthClient(isProd);

    // exchange access code for access token
    const { tokens } = await oauthClient.getToken(accessCode);

    // return tokens to calling function
    return tokens;
}

/**
 * Uses the access token provided by Google to request the end-user's information from Google.
 * @param {string} accessToken - The access token provided by Google in exchange for an access code that can be
 *      used by the application to make requests for the end-user's restricted information on their behalf.
 * @returns - An object containing the end-user's given name and family name.
 */
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

/**
 * Decodes the provided idToken/JSON web token.
 * @param {string} idToken - A JSON web token.
 * @param {boolean} isProd - True if the application is running in production. Otherwise, false.
 * @returns - The decoded JSON web token if the provided isToken is valid. Otherwise, null.
 */
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

/**
 * Generates a random secret phrase to be used as state when the end-user is redirect to the Google OAuth 2.0
 * endpoint.
 * @returns - A random secret phrase used as state to prevent XSRF attacks.
 */
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
