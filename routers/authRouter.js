'use strict';

// imports
const express = require('express');
const { isProd } = require('../utilities/configUtils');
const { getAuthorizationUrl } = require('../utilities/authorizationUtils');

// instantiate new router object
const router = express.Router();

router.get('/authorization-url', (req, res) => {
    const authorizationUrl = getAuthorizationUrl(isProd(req));
    res.status(200).send(authorizationUrl);
});

router.get('/oauth', (req, res) => {

});

// exports
module.exports = router;
