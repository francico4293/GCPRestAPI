'use strict';

// imports
const express = require('express');

// instantiate new router object
const router = express.Router();

router.get('/', async (req, res) => {
    res.send();
});

// exports
module.exports = router;
