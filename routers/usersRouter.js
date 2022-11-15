'use strict';

// imports
const express = require('express');
const { fetchAllUsers } = require('../models/userModel');

// instantiate new router object
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const users = await fetchAllUsers();
        res.status(200).set('Content-Type', 'application/json').json(users);
    } catch (err) {
        next(err);
    }
});

// exports
module.exports = router;
