'use strict';

// imports
const express = require('express');
const { createHangar } = require('../models/hangarModel');
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

// instantiate new router object
const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
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

        // verify that name attribute is valid
        if (!isNameValid(req.body.name)) {
            return res.status(400)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Name attribute is missing or invalid" });
        }

        // verify that location attribute is valid
        if (!isLocationValid(req.body.location)) {
            return res.status(400)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Location attribute is missing or invalid" });
        }

        // verify that capacity attribute is valid
        if (!isCapacityValid(req.body.capacity)) {
            return res.status(400)
                .set(CONTENT_TYPE, APPLICATION_JSON)
                .json({ "Error": "Capacity attribute is missing or invalid" });
        }

        // create a new hangar using specified attribute values
        const id = await createHangar(req.body.name, req.body.location, req.body.capacity);

        // return status 201 and newly created hangar object
        res.status(201)
            .set(CONTENT_TYPE, APPLICATION_JSON)
            .json(
                {
                    id,
                    name: req.body.name,
                    location: req.body.location,
                    capacity: req.body.capacity,
                    planes: [],
                    self: createSelfLink(req.protocol, req.get(HOST), req.baseUrl, id)
                }
            );
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
