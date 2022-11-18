'use strict';

// imports
const express = require('express');
const { fetchAllUsers } = require('../models/userModel');
const { isReqHeaderValid } = require('../utilities/serverUtils');
const { 
    CONTENT_TYPE, 
    APPLICATION_JSON, 
    ANY_MIME_TYPE,
} = require('../constants/serverConstants'); 

// instantiate new router object
const router = express.Router();

/**
 * Handler for GET /users endpoint. This endpoint is used to fetch all users currently signed up
 * for the application.
 */
router.get('/', async (req, res, next) => {
    try {
        // accept header must be */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(406)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // fetch all users from datastore
        const users = await fetchAllUsers();

        // return status 200 and users array in response body
        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(users);
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
