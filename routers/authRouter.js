'use strict';

// imports
const express = require('express');
const { isProd } = require('../utilities/configUtils');
const { 
    getAuthorizationUrl, 
    getTokens, 
    getUserInfo,
    decodeIdToken
} = require('../utilities/utils');
const { 
    fetchUser, 
    createUser 
} = require('../models/userModel');
const { isStateValid } = require('../middleware/validationMiddleware');
const { ERROR, USER_INFO } = require('../constants/handlebarConstants');

// instantiate new router object
const router = express.Router();

router.get('/authorization-url', async (req, res) => {
    try {
        // get url used to redirect end-user to Google OAuth 2.0 endpoint
        const authorizationUrl = await getAuthorizationUrl(isProd(req));
        // send url in response with status code 200
        res.status(200).send(authorizationUrl);
    } catch (err) {
        // send status 500 if an error occurs
        res.status(500).send();
    }
});

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
                { givenName: user.givenName, jwt: tokens.id_token }
            );
        }

        // send request for user info using access token
        const userInfo = await getUserInfo(tokens.access_token);

        // if user userInfo is null, then an error has occurred
        if (userInfo === null) {
            throw new Error;
        }

        // create the user in datastore
        await createUser(userInfo.names[0].givenName, userInfo.names[0].familyName, jwt.sub);

        // render user info view with end-user's given name and their JSON web token
        res.render(
            USER_INFO, 
            { givenName: userInfo.names[0].givenName, jwt: tokens.id_token }
        );
    } catch (err) {
        // log error and render error view
        console.error(err);
        res.render(ERROR);
    }
});

// exports
module.exports = router;
