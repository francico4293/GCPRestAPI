'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment7/blob/main/utilities/utils.js
// AUTHOR: Colin Francis
// DESCRIPTION: I referenced code I wrote and submitted as part of assignment 7 for CS493
//      this quarter. Source code is available upon request

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

    // ***** BEGIN CODE CITATION *****
    // The following code is not my own
    // SOURCE: https://developers.google.com/identity/protocols/oauth2/web-server
    // AUTHOR: Google
    // The following code is used to configure a new Google OAuth 2.0 client using the client_id, client_secret
    // and redirect_uris that were registered for this application with Google OAuth 2.0 provider. 

    // configure and return OAuth 2.0 client
    return new google.auth.OAuth2(
        clientCredentialsJson.web.client_id,
        clientCredentialsJson.web.client_secret,
        clientCredentialsJson.web.redirect_uris[redirectUriIdx]
    );
    // ***** END CODE CITATION *****
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

    // ***** BEGIN CODE CITATION *****
    // The following code is not my own
    // SOURCE: https://developers.google.com/identity/protocols/oauth2/web-server
    // AUTHOR: Google
    // The following code is used to configure a URL that is used to redirect an end-user to the Google OAuth
    // 2.0 endpoint. The attributes of the object passed into the generateAuthUrl method are user to configure
    // the specification of the URL to be generated.

    // configure and return url to redirect used to OAuth 2.0 endpoint
    return oauthClient.generateAuthUrl({
        access_type: OFFLINE,
        scope: USER_INFO_PROFILE_SCOPE,
        include_granted_scopes: true,
        state
    });
    // ***** END CODE CITATION *****
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

    // ***** BEGIN CODE CITATION *****
    // The following code is not my own
    // SOURCE: https://developers.google.com/identity/protocols/oauth2/web-server
    // AUTHOR: Google
    // The following code is used to exchange an access code given to the end-user by the Google OAuth 2.0 endpoint
    // for tokens. Of importance in these tokens is the id_token which is a JWT used to authenticate the user and an
    // access token that can be used to make requests for the user's protected resources.

    // exchange access code for access token
    const { tokens } = await oauthClient.getToken(accessCode);
    // ***** END CODE CITATION

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

        // ***** BEGIN CODE CITATION *****
        // The following code is not my own
        // SOURCE: https://developers.google.com/identity/sign-in/web/backend-auth
        // AUTHOR: Google
        // The following code is used to decode a JSON web token. If no JWT is provided or if the provided
        // JWT is invalid, then an error will be thrown by the verifyIdToken method. If the JWT is valid, the
        // decoded JWT is returned as a ticket and the JSON web token payload is then extracted from the 
        // ticket using the getPayload method.

        // verify id token is valid
        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: clientCredentialsJson.web.client_id
        });

        // return JSON web token
        return ticket.getPayload();
        // ***** END CODE CITATION *****
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
    // ***** BEGIN CODE CITATION *****
    // The following code is not my own
    // SOURCE: https://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
    // AUTHOR: phoenix2010
    // The following code generated a specified number of random bytes. These random bytes are then converted to
    // a string using a hex encoding.

    // return random secret phrase
    return crypto.randomBytes(NUMBER_OF_RAND_BYTES).toString(HEX);
    // ***** END CODE CITATION *****
}

// exports
module.exports = { 
    getOauthClient, 
    getAuthorizationUrl,
    getTokens,
    getUserInfo,
    decodeIdToken
};
