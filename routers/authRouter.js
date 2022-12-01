'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment6/blob/main/server.js
// AUTHOR: Colin Francis
// DESCRIPTION: I referenced the above sources while developing the endpoints below. The sources were
//      assignments previously submitted this quarter for CS493. Source codeis available upon request.


// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://developers.google.com/identity/protocols/oauth2/web-server
// Author: Google
// This documentation provided at the URL above was used as a guide in creating the application.

// imports
const express = require('express');
const { isProd } = require('../utilities/serverUtils');
const { 
    getAuthorizationUrl, 
    getTokens, 
    getUserInfo,
    decodeIdToken
} = require('../utilities/authUtils');
const { 
    fetchUser, 
    createUser 
} = require('../models/userModel');
const { isStateValid } = require('../middleware/validationMiddleware');
const { 
    ERROR, 
    USER_INFO 
} = require('../constants/handlebarConstants');
const { NUMBER_OF_USERS } = require('../constants/usersConstants');

// instantiate new router object
const router = express.Router();

/**
 * Handler for GET /auth/authorization-url endpoint. This endpoint is used to retrieve the authorization url that
 * will be used to redirect the end-user to the Google OAuth 2.0 endpoint.
 */
router.get('/authorization-url', async (req, res, next) => {
    try {
        // get url used to redirect end-user to Google OAuth 2.0 endpoint
        const authorizationUrl = await getAuthorizationUrl(isProd(req));
        // send url in response with status code 200
        res.status(200).send(authorizationUrl);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for GET /auth/oauth endpoint. This endpoint is used by the Google OAuth 2.0 endpoint to redirect the user
 * back to the application with an access code. This endpoint will used the access code in order to get an access token
 * from Google. This endpoint will use the access token to request the user's information and will render a view greeting
 * the user and displaying their unique user ID and a JSON web token they can use for authentication and authorization.
 */
router.get('/oauth', isStateValid, async (req, res) => {
    try {
        // exchange access code for tokens
        const tokens = await getTokens(req.query.code, isProd(req));

        // use id token to get JSON web token
        const jwt = await decodeIdToken(tokens.id_token);

        // null value for jwt represents invalid id token was provided
        if (jwt === null) {
            throw new Error;
        }

        // fetch user from datastore using user id
        const user = await fetchUser(jwt.sub);

        // user account already exists in datastore
        if (user !== null) {
            // render user info view with end-user's given name and their JSON web token
            return res.render(
                USER_INFO, 
                { givenName: user.givenName, userId: user.id, jwt: tokens.id_token }
            );
        }

        // send request for user info using access token
        const userInfo = await getUserInfo(tokens.access_token);

        // if user userInfo is null, then an error has occurred
        if (userInfo === null) {
            throw new Error;
        }

        // create the user in datastore
        await createUser(jwt.sub, userInfo.names[0].givenName, userInfo.names[0].familyName);

        // increment number of users
        req.app.set(NUMBER_OF_USERS, req.app.get(NUMBER_OF_USERS) + 1);

        // render user info view with end-user's given name and their JSON web token
        res.render(
            USER_INFO, 
            { givenName: userInfo.names[0].givenName, userId: jwt.sub, jwt: tokens.id_token }
        );
    } catch (err) {
        // log error and render error view
        console.error(err);
        res.render(ERROR);
    }
});

// exports
module.exports = router;
