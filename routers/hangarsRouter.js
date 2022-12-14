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
const { Datastore } = require('@google-cloud/datastore');
const { 
    createHangar, 
    getQueryResultsForHangars,
    getTotalHangarsCount,
    fetchHangarById,
    addAircraftToHangar,
    removeAircraftFromHangar,
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
    HOST,
    ALLOW,
    GET,
    POST
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
    HTTP_403_FORBIDDEN,
    HTTP_405_METHOD_NOT_ALLOWED
} = require('../constants/statusCodes');
const { 
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
                .json({ 'Error': 'Content-Type must be application/json' });
        }

        // verify accept header is application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Accept header must be application/json' });
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
        // verify accept header is application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Accept header must be application/json' });
        }

        // get raw query results for all hangars
        const queryResults = await getQueryResultsForHangars(req.query.cursor);

        // get total number of hangars
        const totalHangars = await getTotalHangarsCount();

        // initialize object to send in response body
        const responseJson = { totalHangars, hangars: [] };

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

        // ***** BEGIN CODE CITATION *****
        // The following code is not my own / was developed while heavily referencing the following source.
        // SOURCE: https://canvas.oregonstate.edu/courses/1890665/pages/exploration-intermediate-rest-api-features-with-node-dot-js?module_item_id=22486462
        // AUTHOR: Oregon State University
        // The following code checks the raw query result returned by Google Datastore to see if the moreResults attribute is equal to
        // the string 'MORE_RESULTS_AFTER_LIMIT'. If this is the case, then this means that a cursor exists as part of the raw query results
        // since there are more results that can be retrieved from Google Datastore. If the condition is true, then the cursor value is added
        // to a root URL as a query parameter and this full URL is added to the response body as the attribute "next". This can then be used
        // for pagination.

        // add cursor as "next" parameter if more result remain
        if (queryResults[1].moreResults === MORE_RESULTS_AFTER_LIMIT) {
            responseJson.next = `${req.protocol}://${req.get(HOST)}${req.baseUrl}?` + 
                `cursor=${encodeURIComponent(queryResults[1].endCursor)}`;
        }
        // ***** END CODE CITATION *****

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
        // verify accept header is application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Accept header must be application/json' });
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

        // check if aircraft is already parked in a hangar
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

/**
 * Handler for DELETE /hangars/:hangarId/aircrafts/:aircraftId endpoint. This endpoint allows the owner of an aircraft
 * to remove the aircraft from a hangar that it is parked in.
 */
router.delete('/:hangarId/aircrafts/:aircraftId', isJwtValid, async (req, res, next) => {
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

        // check if hangar contains any aircrafts
        if (hangar.aircrafts.length === 0) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This hangar is empty' });
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

        // verify that aircraft is parked at this hangar
        if (aircraft.hangar !== req.params.hangarId) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'This aircraft is not parked at this hangar' });
        }

        await removeAircraftFromHangar(req.params.hangarId, req.params.aircraftId);

        // makr aircraft as "in flight"
        aircraft = await updateAircraft(req.params.aircraftId, { hangar: null });

        // return status 204
        res.status(HTTP_204_NO_CONTENT).send();
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for PATCH /hangars/:hangarId endpoint. This endpoint allows a user to partially update the
 * attributes of an existing hangar.
 */
router.patch('/:hangarId', async (req, res, next) => {
    try {
        // verify content-type in request body is application/json
        if (!isReqHeaderValid(req.headers[CONTENT_TYPE], APPLICATION_JSON)) {
            return res.status(HTTP_415_UNSUPPORTED_MEDIA_TYPE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Content-Type must be application/json' });
        }

        // verify accept header is application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Accept header must be application/json' });
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

        // return status 200 and updated hangar
        res.status(200)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(hangar);
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for PUT /hangars/:hangarId endpoint. This endpoint allows a user to fully update the
 * attributes of an existing hangar.
 */
router.put('/:hangarId', async (req, res, next) => {
    try {
        // verify content-type in request body is application/json
        if (!isReqHeaderValid(req.headers[CONTENT_TYPE], APPLICATION_JSON)) {
            return res.status(HTTP_415_UNSUPPORTED_MEDIA_TYPE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Content-Type must be application/json' });
        }

        // verify accept header is application/json
        if (!isReqHeaderValid(req.headers.accept, APPLICATION_JSON)) {
            return res.status(HTTP_406_NOT_ACCEPTABLE)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'Accept header must be application/json' });
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

        // fetch the hangar with hangarId
        let hangar = await fetchHangarById(req.params.hangarId);

        // if hangar is null then no hangar with hangarId exists
        if (hangar === null) {
            return res.status(HTTP_404_NOT_FOUND)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ 'Error': 'No hangar with this hangarId exists' });
        }

        // verify that capacity update will not make current aircrafts parked in the hangar invalid
        if (req.body.capacity < hangar.aircrafts.length) {
            return res.status(HTTP_400_BAD_REQUEST)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Hangar capacity cannot be less than the current number of aircrafts in the hangar" });
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

/**
 * Handler for PUT /hangars endpoint. Fully updating all hangars is not allowed.
 */
router.put('/', (req, res, next) => {
    try {
        res.status(HTTP_405_METHOD_NOT_ALLOWED)
            .set(ALLOW, `${GET}, ${POST}`)
            .json({ 'Error': 'Updating all hangars is not allowed' });
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
            .json({ 'Error': 'Updating all hangars is not allowed' });
    } catch (err) {
        next(err);
    }
});

/**
 * Handler for DELETE /aircrafts endpoint. Deleting all aircrafts is not allowed.
 */
router.delete('/', (req, res, next) => {
    try {
        res.status(HTTP_405_METHOD_NOT_ALLOWED)
            .set(ALLOW, `${GET}, ${POST}`)
            .json({ 'Error': 'Deleting all hangars is not allowed' });
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
