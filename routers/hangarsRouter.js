'use strict';

// imports
const express = require('express');
const { Datastore } = require('@google-cloud/datastore');
const { 
    createHangar, 
    getQueryResultsForHangars,
    fetchHangarById,
    addAircraftToHangar,
    updateHangar,
    deleteHangarById
} = require('../models/hangarModel');
const {
    updateAircraft,
    fetchAircraftById 
} = require('../models/aircraftModel');
const { 
    isReqHeaderValid, 
    createSelfLink 
} = require('../utilities/serverUtils');
const { removeExtraSpacingFromString } = require('../utilities/formattingUtils');
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
    HTTP_204_NO_CONTENT,
    HTTP_403_FORBIDDEN
} = require('../constants/statusCodes');
const { 
    NUMBER_OF_HANGARS, 
    NAME,
    CITY,
    STATE,
    CAPACITY
} = require('../constants/hangarConstants');

// instantiate new router object
const router = express.Router();

/**
 * Handler for POST /hangars endpoint. This endpoint is used to create a new hangar by specifying the
 * name, city, state, and capacity of the hangar. This endpoint does not require authentication or
 * authorization.
 */
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

        // format name
        req.body.name = removeExtraSpacingFromString(req.body.name);

        // verify that city attribute is valid
        if (!isCityValid(req.body.city)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "City attribute is missing or invalid" });
        }

        // format city
        req.body.city = removeExtraSpacingFromString(req.body.city);

        // verify that state attribute is valid
        if (!isStateValid(req.body.state)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "State attribute is missing or invalid" });
        }

        // format state
        req.body.state = removeExtraSpacingFromString(req.body.state);

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

        // increment number of hangars
        req.app.set(NUMBER_OF_HANGARS, req.app.get(NUMBER_OF_HANGARS) + 1);

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

/**
 * Handler for GET /hangars. This endpoint is used to retrieve all hangars that have been created. This 
 * endpoint does not require authentication or authorization.
 */
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
        const responseJson = { count: req.app.get(NUMBER_OF_HANGARS), hangars: [] };

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

/**
 * Handler for GET /hangars/:hangarId. This endpoint is used to fetch a hangar by specifying its hangarId as
 * a request parameter. This endpoint does not require authorization or authentication.
 */
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

/**
 * Handler for PUT /hangars/:hangarId/aircrafts/:aircraftId endpoint. This endpoint allows the owner of the
 * aircraft with aircraftId to park the aircraft in the hangar with hangarId. This endpoint requires a valid
 * JSON web token to be provided as a Bearer Token.
 */
router.put('/:hangarId/aircrafts/:aircraftId', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

        // fetch the hangar with hangarId
        let hangar = await fetchHangarById(req.params.hangarId);

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
        let aircraft = await fetchAircraftById(req.params.aircraftId);

        // if aircraft is null then no aircraft with aircraftId exists
        if (aircraft === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No aircraft with this aircraftId exists' });
        }

        // verify that the requester is the owner of the aircraft
        if (aircraft.ownerId !== req.jwt.sub) {
            return res.status(HTTP_403_FORBIDDEN)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'You are not authorized to perform this action' });
        }

        if (aircraft.hangar !== null) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This aircraft is already parked in a hangar' });
        }

        // add the aircraft to the hangar
        await addAircraftToHangar(req.params.hangarId, req.params.aircraftId);

        // mark the aircraft as parked in a hangar
        aircraft = await updateAircraft(req.params.aircraftId, { hangar: req.params.hangarId });

        // return status 204
        res.status(HTTP_204_NO_CONTENT).send();
    } catch (err) {
        next(err);
    }
});

router.delete('/:hangarId/aircrafts/:aircraftId', isJwtValid, async (req, res, next) => {

});

router.patch('/:hangarId', async (req, res, next) => {
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

        // fetch the hangar with hangarId
        let hangar = await fetchHangarById(req.params.hangarId);

        // if hangar is null then no hangar with hangarId exists
        if (hangar === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No hangar with this hangarId exists' });
        }

        // check if name attribute was provided in request body
        if (req.body.name !== null && req.body.name !== undefined) {
            // verify that name attribute is valid
            if (!isNameValid(req.body.name)) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ "Error": "Name attribute is invalid" });
            }

            // format name
            req.body.name = removeExtraSpacingFromString(req.body.name);
        }
        
        // check if city attribute was provided in request body
        if (req.body.city !== null && req.body.city !== undefined) {
            // verify that city attribute is valid
            if (!isCityValid(req.body.city)) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ "Error": "City attribute is invalid" });
            }

            // format city
            req.body.city = removeExtraSpacingFromString(req.body.city);
        }

        // check if state attribute was provided in request body
        if (req.body.state !== null && req.body.state !== undefined) {
            // verify that state attribute is valid
            if (!isStateValid(req.body.state)) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ "Error": "State attribute is invalid" });
            }

            // format state
            req.body.state = removeExtraSpacingFromString(req.body.state);
        }
        
        // verify that capacity attribute was provided in request body
        if (req.body.capacity !== null && req.body.capacity !== undefined) {
            // verify that capacity attribute is valid
            if (!isCapacityValid(req.body.capacity)) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ "Error": "Capacity attribute is invalid" });
            }

            // verify that capacity update will not make current aircrafts parked in the hangar invalid
            if (req.body.capacity < hangar.aircrafts.length) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ "Error": "Hangar capacity cannot be less than the current number of aircrafts in the hangar" });
            }
        }

        // prevent any invalid object keys from being included in update object
        Object.keys(req.body).forEach(key => {
            if (![ NAME, CITY, STATE, CAPACITY ].includes(key)) {
                delete req.body[key];
            }
        });

        // update the hangar
        hangar = await updateHangar(req.params.hangarId, req.body);

        // add self link to hangar object
        hangar.self = createSelfLink(req.protocol, req.get(HOST), req.baseUrl, req.params.hangarId);

        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(hangar);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for DELETE /hangars/:hangarId endpoint. This endpoint is used to delete the hangar with
 * the hangarId provided as a request parameter. If the hangar being deleted has any aircrafts parked
 * in it, those aircrafts will go into flight.
 */
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

        // decrement number of hangars
        req.app.set(NUMBER_OF_HANGARS, req.app.get(NUMBER_OF_HANGARS) - 1);

        // mark each aircraft in hangar as being "in flight"
        for (let aircraft of hangar.aircrafts) {
            await updateAircraft(aircraft, { hangar: null });
        }

        // return status 204
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
