'use strict';

// imports
const express = require('express');
const { Datastore } = require('@google-cloud/datastore');
const { 
    createHangar, 
    getQueryResultsForHangars,
    fetchHangarById
} = require('../models/hangarModel');
const { 
    isReqHeaderValid, 
    createSelfLink 
} = require('../utilities/serverUtils');
const { 
    isNameValid, 
    isLocationValid, 
    isCapacityValid 
} = require('../utilities/hangarUtils');
const { 
    CONTENT_TYPE,
    APPLICATION_JSON, 
    ANY_MIME_TYPE,
    HOST 
} = require('../constants/serverConstants');
const { MORE_RESULTS_AFTER_LIMIT } = require('../constants/datastoreConstants');
const {
    HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    HTTP_406_NOT_ACCEPTABLE,
    HTTP_400_BAD_REQUEST,
    HTTP_201_CREATED,
    HTTP_200_OK,
    HTTP_404_NOT_FOUND
} = require('../constants/statusCodes');

// instantiate new router object
const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        // verify content-type in request body is application/json
        if (!isReqHeaderValid(req.headers[CONTENT_TYPE], APPLICATION_JSON)) {
            return res.status(HTTP_415_UNSUPPORTED_MEDIA_TYPE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only accepts application/json' });
        }

        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // verify that name attribute is valid
        if (!isNameValid(req.body.name)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Name attribute is missing or invalid" });
        }

        // verify that location attribute is valid
        if (!isLocationValid(req.body.location)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Location attribute is missing or invalid" });
        }

        // verify that capacity attribute is valid
        if (!isCapacityValid(req.body.capacity)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Capacity attribute is missing or invalid" });
        }

        // create a new hangar using specified attribute values
        const id = await createHangar(req.body.name, req.body.location, req.body.capacity);

        // return status 201 and newly created hangar object
        res.status(HTTP_201_CREATED)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(
                {
                    id,
                    name: req.body.name,
                    location: req.body.location,
                    capacity: req.body.capacity,
                    aircrafts: [],
                    self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, id)
                }
            );
    } catch (err) {
        next(err);
    }
});

router.get('/', async (req, res, next) => {
    try {
        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // get raw query results for all hangars
        const queryResults = await getQueryResultsForHangars(req.query.cursor);

        // initialize object to send in response body
        const responseJson = { hangars: [] };

        // populate hangars array in responseJson with hangars from query results
        queryResults[0].forEach(result => {
            responseJson.hangars.push(
                {
                    id: parseInt(result[Datastore.KEY].id),
                    name: result.name,
                    location: result.location,
                    capacity: result.capacity,
                    aircrafts: result.aircrafts,
                    self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, result[Datastore.KEY].id)
                }
            );
        });

        // add cursor as "next" parameter if more result remain
        if (queryResults[1].moreResults === MORE_RESULTS_AFTER_LIMIT) {
            responseJson.next = `${req.protocol}://${req.get(HOST)}${req.baseUrl}?` + 
                `cursor=${encodeURIComponent(queryResults[1].endCursor)}`;
        }

        // return object with hangars array and possible next attribute with status 200
        res.status(HTTP_200_OK)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(responseJson);
    } catch (err) {
        next(err);
    }
});

router.get('/:hangarId', async (req, res, next) => {
    try {
        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }
        
        // fetch the hangar with hangarId
        const hangar = await fetchHangarById(req.params.hangarId);

        // if hangar is null then no hangar with hangarId exists
        if (hangar === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No hangar with this hangarId exists' });
        }

        // set self link on hangar object
        hangar.self = createSelfLink(req.protocol, req.get(HOST), req.baseUrl, req.params.hangarId);

        // return hangar object and status 200
        res.status(HTTP_200_OK)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(hangar);
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
