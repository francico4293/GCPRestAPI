'use strict';

// imports
const express = require('express');
const { isJwtValid } = require('../middleware/authMiddleware');
const { createAircraft } = require('../models/aircraftModel');
const { 
    isReqHeaderValid, 
    createSelfLink 
} = require('../utilities/serverUtils');
const { 
    isMakeValid, 
    isModelValid,
    isLengthValid,
    removeExtraSpacingFromString 
} = require('../utilities/aircraftUtils');
const { 
    CONTENT_TYPE, 
    APPLICATION_JSON, 
    ANY_MIME_TYPE 
} = require('../constants/serverConstants');
const { HOST } = require('../constants/serverConstants');

// instantiate new router object
const router = express.Router();

router.post('/', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(401).send();
        }

        // verify content-type in request body is application/json
        if (!isReqHeaderValid(req.headers[CONTENT_TYPE], APPLICATION_JSON)) {
            return res.status(415)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only accepts application/json' });
        }

        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(406)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // verify make is provided in request and is valid
        if (!isMakeValid(req.body.make)) {
            return res.status(400)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Make attribute is missing or invalid' });
        }

        // sanitize make
        req.body.make = removeExtraSpacingFromString(req.body.make);

        // verify model is provided in request and is valid
        if (!isModelValid(req.body.model)) {
            return res.status(400)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Model attribute is missing or invalid' });
        }

        // sanitize model
        req.body.model = removeExtraSpacingFromString(req.body.model);

        // verify length is provided in request and is valid
        if (!isLengthValid(req.body.length)) {
            return res.status(400)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Length attribute is missing or invalid' });
        }

        // create new aircraft with attributes from request body
        const id = await createAircraft(req.body.make, req.body.model, req.body.length, req.jwt.sub);

        // generate self link for aircraft
        const aircraftSelfLink = createSelfLink(req.protocol, req.get(HOST), req.baseUrl, id);

        // return aircraft object with status code 201
        res.status(201)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json({ 
                id, 
                make: req.body.make, 
                model: req.body.model, 
                length: req.body.length, 
                hangar: null,
                ownerId: req.jwt.sub, 
                self: aircraftSelfLink 
            });
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
