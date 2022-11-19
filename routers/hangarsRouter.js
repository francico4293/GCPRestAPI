'use strict';

// imports
const express = require('express');
const { Datastore } = require('@google-cloud/datastore');
const { 
    createHangar, 
    getQueryResultsForHangars,
    fetchHangarById,
    updateHangarAircrafts,
    deleteHangarById
} = require('../models/hangarModel');
const { updateAircraftHangar } = require('../models/aircraftModel');
const { 
    isReqHeaderValid, 
    createSelfLink 
} = require('../utilities/serverUtils');
const { 
    isNameValid, 
    isCityValid,
    isStateValid, 
    isCapacityValid,
    createAircraftObjectsArray
} = require('../utilities/hangarUtils');
const { isJwtValid } = require('../middleware/authMiddleware');
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
    HTTP_404_NOT_FOUND,
    HTTP_401_UNAUTHORIZED,
    HTTP_204_NO_CONTENT
} = require('../constants/statusCodes');
const { fetchAircraftById } = require('../models/aircraftModel');

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

        // verify that city attribute is valid
        if (!isCityValid(req.body.city)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "City attribute is missing or invalid" });
        }

        // verify that state attribute is valid
        if (!isStateValid(req.body.state)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "State attribute is missing or invalid" });
        }

        // verify that capacity attribute is valid
        if (!isCapacityValid(req.body.capacity)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Capacity attribute is missing or invalid" });
        }

        // create a new hangar using specified attribute values
        const id = await createHangar(
            req.body.name, 
            req.body.city, 
            req.body.state, 
            req.body.capacity
        );

        // return status 201 and newly created hangar object
        res.status(HTTP_201_CREATED)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(
                {
                    id,
                    name: req.body.name,
                    city: req.body.city,
                    state: req.body.state,
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
                    city: result.city,
                    state: result.state,
                    capacity: result.capacity,
                    aircrafts: createAircraftObjectsArray(req, result.aircrafts),
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

        // create array of objects containing aircraft id and aircraft self link
        hangar.aircrafts = createAircraftObjectsArray(req, hangar.aircrafts);

        // return hangar object and status 200
        res.status(HTTP_200_OK)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(hangar);
    } catch (err) {
        next(err);
    }
});

router.put('/:hangarId/aircrafts/:aircraftId', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

        // fetch the hangar with hangarId
        const hangar = await fetchHangarById(req.params.hangarId);

        // if hangar is null then no hangar with hangarId exists
        if (hangar === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No hangar with this hangarId exists' });
        }

        // check if hangar is at capacity
        if (hangar.aircrafts.length === hangar.capacity) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This hangar is at capacity' });
        }

        // fetch the aircraft with aircraftId
        const aircraft = await fetchAircraftById(req.params.aircraftId);

        // if aircraft is null then no aircraft with aircraftId exists
        if (aircraft === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No aircraft with this aircraftId exists' });
        }

        // verify that the requester is the owner of the aircraft
        if (aircraft.ownerId !== req.jwt.sub) {
            return res.status(403)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'You are not authorized to perform this action' });
        }

        if (aircraft.hangar !== null) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This aircraft is already parked in a hangar' });
        }

        // add the aircraft to the hangar
        await updateHangarAircrafts(req.params.hangarId, req.params.aircraftId);

        // mark the aircraft as parked in a hangar
        await updateAircraftHangar(req.params.aircraftId, req.params.hangarId);

        // return status 204
        res.status(HTTP_204_NO_CONTENT).send();
    } catch (err) {
        next(err);
    }
});

// TODO: Add logic to remove hangar from aircrafts in hangar
router.delete('/:hangarId', async (req, res, next) => {
    try {
        // fetch the hangar with hangarId
        const hangar = await fetchHangarById(req.params.hangarId);

        // if hangar is null than no hangar exists with specified hangarId
        if (hangar === null) {
            return res.status(404)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No hangar with this hangarId exists' });
        }

        // delete the hangar
        await deleteHangarById(req.params.hangarId);

        // return status 204
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
