'use strict';

const MIN_AIRCRAFT_WINGSPAN = 2;

const MAX_AIRCRAFT_WINGSPAN = 150;

const AIRCRAFT_MAKE_REGEX = /^[A-Za-z\s]+$/;

const AIRCRAFT_MODEL_REGEX = /^[A-Za-z\s0-9-/]+$/;

const OWNER_ID = "ownerId";

module.exports = { 
    MIN_AIRCRAFT_WINGSPAN,
    MAX_AIRCRAFT_WINGSPAN, 
    AIRCRAFT_MAKE_REGEX, 
    AIRCRAFT_MODEL_REGEX,
    OWNER_ID
};
