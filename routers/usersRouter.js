'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment4/tree/main/routers
// SOURCE: https://github.com/francico4293/CS493-Assignment5/tree/main/routers
// AUTHOR: Colin Francis
// DESCRIPTION: I referenced code I wrote in the above sources while developing the endpoints below.
//      These sources were assignments previously submitted this quarter for CS493. Source code is 
//      available upon request.

// imports
const express = require('express');
const { fetchAllUsers } = require('../models/userModel');
const { isReqHeaderValid } = require('../utilities/serverUtils');
const { 
    CONTENT_TYPE, 
    APPLICATION_JSON
} = require('../constants/serverConstants'); 
const { NUMBER_OF_USERS } = require('../constants/usersConstants');

// instantiate new router object
const router = express.Router();

/**
 * Handler for GET /users endpoint. This endpoint is used to fetch all users currently signed up
 * for the application.
 */
router.get('/', async (req, res, next) => {
    try {
        // accept header must be application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON)) {
            return res.status(406)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Accept header must be application/json' });
        }

        // fetch all users from datastore
        const users = await fetchAllUsers();

        // return status 200 and users array in response body
        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(
                {
                    totalUsers: req.app.get(NUMBER_OF_USERS),
                    users
                }
            );
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
