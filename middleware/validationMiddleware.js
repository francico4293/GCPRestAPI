'use strict';

const { fetchAllStates } = require("../models/stateModel");
const { ERROR } = require("../constants/handlebarConstants");

/**
 * Middleware used to verify that the state value the end-user is returning from the Google OAuth 2.0 endpoint
 * is the same one that the application redirected the user to the Google OAuth 2.0 endpoint with.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - Used to move to the next piece of middleware.
 */
const isStateValid = async (req, res, next) => {
    try {
        // fetch all state values generated by our application and stored in datastore
        const states = await fetchAllStates();

        // if state value end-user returned with from Google OAuth 2.0 endpoint isn't one
        // generated by our application
        if (!states.includes(req.query.state)) {
            throw new Error;
        }

        // move to next piece of middleware
        next();
    } catch (err) {
        // log any errors and render error view
        console.error(err);
        res.render(ERROR);
    }
}

// exports
module.exports = { isStateValid };
