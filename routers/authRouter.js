'use strict';

// imports
const express = require('express');
const { isProd } = require('../utilities/configUtils');
const { getAuthorizationUrl } = require('../utilities/authorizationUtils');

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

router.get('/oauth', async (req, res) => {

});

// exports
module.exports = router;
