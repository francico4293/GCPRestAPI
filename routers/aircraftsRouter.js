'use strict';

// imports
const express = require('express');
const { Datastore } = require('@google-cloud/datastore');
const { isJwtValid } = require('../middleware/authMiddleware');
const { 
    createAircraft, 
    getAircraftQueryResultsForOwner 
} = require('../models/aircraftModel');
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
const { MORE_RESULTS_AFTER_LIMIT } = require('../constants/datastoreConstants');
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
                self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, id) 
            });
    } catch (err) {
        next(err);
    }
});

router.get('/', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(401).send();
        }

        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(406)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // fetch all aircrafts for jwt sub from datastore
        const queryResults = await getAircraftQueryResultsForOwner(req.jwt.sub, req.query.cursor);

        // initialize object to send in response body
        const responseJson = { aircrafts: [] };

        // populate aircrafts array in responseJson object with query results
        queryResults[0].forEach(result => {
            responseJson.aircrafts.push({
                id: parseInt(result[Datastore.KEY].id),
                make: result.make,
                model: result.model,
                length: result.length,
                ownerId: result.ownerId,
                self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, result[Datastore.KEY].id)
            });
        });
        
        // if more results remain in datastore, add cursor in responseJson object 
        if (queryResults[1].moreResults === MORE_RESULTS_AFTER_LIMIT) {
            responseJson.next = `${req.protocol}://${req.get(HOST)}${req.baseUrl}?cursor=${encodeURIComponent(queryResults[1].endCursor)}`;
        }

        // return responseJson with status 200
        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(responseJson);
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
