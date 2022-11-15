'use strict';

const { fetchAllStates } = require("../models/stateModel");
const { STATE_ERROR, GENERAL_ERROR } = require("../constants/handlebarConstants");

const isStateValid = async (req, res, next) => {
    try {
        const states = await fetchAllStates();

        if (!states.includes(req.query.state)) {
            return res.render(STATE_ERROR);
        }

        next();
    } catch (err) {
        console.error(err);
        res.render(GENERAL_ERROR);
    }
}

// exports
module.exports = { isStateValid };
