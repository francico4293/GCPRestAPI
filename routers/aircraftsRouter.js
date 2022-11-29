'use strict';

// imports
const express = require('express');
const { Datastore } = require('@google-cloud/datastore');
const { isJwtValid } = require('../middleware/authMiddleware');
const { 
    createAircraft, 
    getQueryResultsForAircraftsByOwner,
    fetchAircraftById,
    updateAircraft,
    deleteAircraftById
} = require('../models/aircraftModel');
const { removeAircraftFromHangar } = require('../models/hangarModel');
const { 
    fetchNumberOfUserAircrafts, 
    incrementNumberOfUserAircrafts ,
    decrementNumberOfUserAircrafts
} = require('../models/userModel');
const { 
    isReqHeaderValid, 
    createSelfLink 
} = require('../utilities/serverUtils');
const { 
    isMakeValid, 
    isModelValid,
    isWingspanValid
} = require('../utilities/aircraftUtils');
const { removeExtraSpacingFromString } = require('../utilities/formattingUtils');
const { 
    CONTENT_TYPE, 
    APPLICATION_JSON, 
    ANY_MIME_TYPE,
    ALLOW,
    GET,
    POST
} = require('../constants/serverConstants');
const { MORE_RESULTS_AFTER_LIMIT } = require('../constants/datastoreConstants');
const { HOST } = require('../constants/serverConstants');
const {
    HTTP_415_UNSUPPORTED_MEDIA_TYPE,
    HTTP_406_NOT_ACCEPTABLE,
    HTTP_400_BAD_REQUEST,
    HTTP_201_CREATED,
    HTTP_200_OK,
    HTTP_401_UNAUTHORIZED,
    HTTP_404_NOT_FOUND,
    HTTP_403_FORBIDDEN,
    HTTP_204_NO_CONTENT,
    HTTP_405_METHOD_NOT_ALLOWED
} = require('../constants/statusCodes');
const { 
    MAKE, 
    MODEL, 
    WINGSPAN 
} = require('../constants/aircraftConstants');

// instantiate new router object
const router = express.Router();

/**
 * Handler for POST /aircrafts/:aircraftId endpoint. This endpoint allows a user to create a new
 * aircraft by providing a valid JSON web token as a Bearer Token and specifying the make, model,
 * and wingspan of the aircraft to be created.
 */
router.post('/', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

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

        // verify make is provided in request and is valid
        if (!isMakeValid(req.body.make)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Make attribute is missing or invalid' });
        }

        // format make
        req.body.make = removeExtraSpacingFromString(req.body.make);

        // verify model is provided in request and is valid
        if (!isModelValid(req.body.model)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Model attribute is missing or invalid' });
        }

        // format model
        req.body.model = removeExtraSpacingFromString(req.body.model);

        // verify wingspan is provided in request and is valid
        if (!isWingspanValid(req.body.wingspan)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Wingspan attribute is missing or invalid' });
        }

        // create new aircraft with attributes from request body
        const id = await createAircraft(req.body.make, req.body.model, req.body.wingspan, req.jwt.sub);

        // increment number of aircrafts owned by user
        await incrementNumberOfUserAircrafts(req.jwt.sub);

        // return aircraft object with status code 201
        res.status(HTTP_201_CREATED)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(
                { 
                    id, 
                    make: req.body.make, 
                    model: req.body.model, 
                    wingspan: req.body.wingspan, 
                    hangar: null,
                    ownerId: req.jwt.sub, 
                    self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, id) 
                }
            );
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for GET /aircrafts endpoint. This endpoint allows a user to view all aircrafts that they own.
 * The response will only return 5 aircrafts at a time. Should the user own more than 5 aircrafts, a next
 * attribute will be included in the response body which is a cursor used for pagination allowing the user
 * to get more aircrafts that they own.
 */
router.get('/', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // fetch all aircrafts for jwt sub from datastore
        const queryResults = await getQueryResultsForAircraftsByOwner(req.jwt.sub, req.query.cursor);

        // get the count of aircrafts for user
        const numberOfUserAircrafts = await fetchNumberOfUserAircrafts(req.jwt.sub);

        // initialize object to send in response body
        const responseJson = { totalAircrafts: numberOfUserAircrafts, aircrafts: [] };

        // populate aircrafts array in responseJson object with query results
        queryResults[0].forEach(result => {
            responseJson.aircrafts.push(
                {
                    id: parseInt(result[Datastore.KEY].id),
                    make: result.make,
                    model: result.model,
                    wingspan: result.wingspan,
                    hangar: result.hangar === null 
                        ? null 
                        : { 
                            id: parseInt(result.hangar), 
                            self: createSelfLink(req.protocol, req.get(HOST), '/hangars', result.hangar)
                        },
                    ownerId: result.ownerId,
                    self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, result[Datastore.KEY].id)
                }
            );
        });
        
        // if more results remain in datastore, add cursor in responseJson object 
        if (queryResults[1].moreResults === MORE_RESULTS_AFTER_LIMIT) {
            responseJson.next = `${req.protocol}://${req.get(HOST)}${req.baseUrl}?` + 
                `cursor=${encodeURIComponent(queryResults[1].endCursor)}`;
        }

        // return responseJson with status 200
        res.status(HTTP_200_OK)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(responseJson);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for GET /aircrafts/:aircraftId endpoint. This endpoint allows a user to get an aircraft that they
 * own using the aircraft's unique aircraftId as a request parameter.
 */
router.get('/:aircraftId', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

        // verify accept header is */* or application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON, ANY_MIME_TYPE)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This endpoint only serves application/json' });
        }

        // fetch the aircraft that has the specified aircraftId
        const aircraft = await fetchAircraftById(req.params.aircraftId);

        // if aircraft is null then no aircraft with aircraftId exists
        if (aircraft === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No aircraft with this aircraftId exists' });
        }

        // verify the requester owns the aircraft
        if (aircraft.ownerId !== req.jwt.sub) {
            return res.status(HTTP_403_FORBIDDEN)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'You are not authorized to perform this action' });
        }

        // add a self link to the aircraft object
        aircraft.self = createSelfLink(req.protocol, req.get(HOST), req.baseUrl, req.params.aircraftId);

        // add self link to hangar if there is one
        aircraft.hangar = aircraft.hangar === null 
            ? null 
            : {
                id: parseInt(aircraft.hangar), 
                self: createSelfLink(req.protocol, req.get(HOST), '/hangars', aircraft.hangar)
            };

        // return aircraft object with status 200
        res.status(HTTP_200_OK)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(aircraft);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for PATCH /aircrafts/:aircraftId endpoint. This endpoint allows a user to partially update the
 * attributes of an existing aircraft that they own.
 */
router.patch('/:aircraftId', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

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

        // check if make was provided in request body
        if (req.body.make !== null && req.body.make !== undefined) {
            // verify that make attribute value is valid
            if (!isMakeValid(req.body.make)) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ 'Error': 'Make attribute is invalid' });
            }

            // format make
            req.body.make = removeExtraSpacingFromString(req.body.make);
        }

        // check if model was provided in request body
        if (req.body.model !== null && req.body.model !== undefined) {
            // verify model attribute value is valid
            if (!isModelValid(req.body.model)) {
                return res.status(HTTP_400_BAD_REQUEST)
                    .set(CONTENT_TYPE, APPLICATION_JSON)
                    .json({ 'Error': 'Model attribute is invalid' });
            }

            // format model
            req.body.model = removeExtraSpacingFromString(req.body.model);
        }

        // verify wingspan attribute value is valid if it was provided in the request body
        if (req.body.wingspan !== null && req.body.wingspan !== undefined && !isWingspanValid(req.body.wingspan)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Wingspan attribute is invalid' });
        }

        // fetch the aircraft that has the specified aircraftId
        let aircraft = await fetchAircraftById(req.params.aircraftId);

        // if aircraft is null then no aircraft with aircraftId exists
        if (aircraft === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No aircraft with this aircraftId exists' });
        }

        // verify the requester owns the aircraft
        if (aircraft.ownerId !== req.jwt.sub) {
            return res.status(HTTP_403_FORBIDDEN)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'You are not authorized to perform this action' });
        }

        // prevent any invalid object keys from being included in update object
        Object.keys(req.body).forEach(key => {
            if (![ MAKE, MODEL, WINGSPAN ].includes(key)) {
                delete req.body[key];
            }
        });

        // update the aircraft
        aircraft = await updateAircraft(req.params.aircraftId, req.body);

        // add self link to aircraft
        aircraft.self = createSelfLink(req.protocol, req.get(HOST), req.baseUrl, req.params.aircraftId);

        // return status 200 and updated aircraft object
        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(aircraft);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for PUT /aicrafts/:aircraftId endpoint. This endpoint allows a user to fully update the
 * attributes of an existing aircraft that they own.
 */
router.put('/:aircraftId', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

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

        // verify make is provided in request and is valid
        if (!isMakeValid(req.body.make)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Make attribute is missing or invalid' });
        }

        // format make
        req.body.make = removeExtraSpacingFromString(req.body.make);

        // verify model is provided in request and is valid
        if (!isModelValid(req.body.model)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Model attribute is missing or invalid' });
        }

        // format model
        req.body.model = removeExtraSpacingFromString(req.body.model);

        // verify wingspan is provided in request and is valid
        if (!isWingspanValid(req.body.wingspan)) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Wingspan attribute is missing or invalid' });
        }

        // fetch the aircraft that has the specified aircraftId
        let aircraft = await fetchAircraftById(req.params.aircraftId);

        // if aircraft is null then no aircraft with aircraftId exists
        if (aircraft === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No aircraft with this aircraftId exists' });
        }

        // verify the requester owns the aircraft
        if (aircraft.ownerId !== req.jwt.sub) {
            return res.status(HTTP_403_FORBIDDEN)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'You are not authorized to perform this action' });
        }

        // prevent any invalid object keys from being included in update object
        Object.keys(req.body).forEach(key => {
            if (![ MAKE, MODEL, WINGSPAN ].includes(key)) {
                delete req.body[key];
            }
        });

        // update the aircraft
        aircraft = await updateAircraft(req.params.aircraftId, req.body);

        // add self link to aircraft
        aircraft.self = createSelfLink(req.protocol, req.get(HOST), req.baseUrl, req.params.aircraftId);

        // return status 200 and updated aircraft object
        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(aircraft);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for DELETE /aircrafts/:aircraftId endpoint. This endpoint allows a user to delete an
 * aircraft they own by specifying the aircraft's unique aircraftId as a request parameter. If
 * the aircraft is parked in a hangar, the aircraft will automatically be removed from the hangar
 * it is parked in.
 */
router.delete('/:aircraftId', isJwtValid, async (req, res, next) => {
    try {
        // if no jwt or an invalid jwt was provided return a 401 status code
        if (req.jwt === null) {
            return res.status(HTTP_401_UNAUTHORIZED)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Bearer token is missing or invalid" });
        }

        // fetch the aircraft that has the specified aircraftId
        const aircraft = await fetchAircraftById(req.params.aircraftId);

        // if aircraft is null then no aircraft with aircraftId exists
        if (aircraft === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No aircraft with this aircraftId exists' });
        }

        // verify the requester owns the aircraft
        if (aircraft.ownerId !== req.jwt.sub) {
            return res.status(HTTP_403_FORBIDDEN)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'You are not authorized to perform this action' });
        }

        // delete the aircraft with aircraftId
        await deleteAircraftById(req.params.aircraftId);

        // decrement number of aircrafts owned by user
        await decrementNumberOfUserAircrafts(req.jwt.sub);

        // remove aircraft from hangar if it is parked in one
        aircraft.hangar !== null && await removeAircraftFromHangar(aircraft.hangar, req.params.aircraftId);

        // return status 204
        res.status(HTTP_204_NO_CONTENT).send();
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for PUT /aircrafts endpoint. Fully updating all aircrafts is not allowed.
 */
router.put('/', (req, res, next) => {
    try {
        res.status(HTTP_405_METHOD_NOT_ALLOWED)
            .set(ALLOW, `${GET}, ${POST}`)
            .json({ 'Error': 'Updating all aircrafts is not allowed' });
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for PATCH /aircrafts endpoint. Partially updating all aircrafts is not allowed.
 */
router.patch('/', (req, res, next) => {
    try {
        res.status(HTTP_405_METHOD_NOT_ALLOWED)
            .set(ALLOW, `${GET}, ${POST}`)
            .json({ 'Error': 'Updating all aircrafts is not allowed' });
    } catch (err) {
        next(err);
    }
});

/**
 * Handler DELETE /aircrafts endpoint. Deleting all aircrafts is not allowed.
 */
router.delete('/', (req, res, next) => {
    try {
        res.status(HTTP_405_METHOD_NOT_ALLOWED)
            .set(ALLOW, `${GET}, ${POST}`)
            .json({ 'Error': 'Deleting all aircrafts is not allowed' });
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
