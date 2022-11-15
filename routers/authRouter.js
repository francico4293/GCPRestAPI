'use strict';

// imports
const express = require('express');
const { isProd } = require('../utilities/configUtils');
const { getAuthorizationUrl, getAccessToken } = require('../utilities/authorizationUtils');
const { isStateValid } = require('../middleware/validationMiddleware');
const { GENERAL_ERROR } = require('../constants/handlebarConstants');

// instantiate new router object
const router = express.Router();

router.get('/authorization-url', async (req, res) => {
    try {
        const authorizationUrl = await getAuthorizationUrl(isProd(req));
        res.status(200).send(authorizationUrl);
    } catch (err) {
        res.status(500).send();
    }
});

router.get('/oauth', isStateValid, async (req, res) => {
    try {
        const accessToken = await getAccessToken(req.query.code, isProd(req));

        // start here - need to check if user exists and, if not, add them to datastore

        res.send(accessToken);
    } catch (err) {
        console.error(err);
        res.render(GENERAL_ERROR);
    }
});

// exports
module.exports = router;
