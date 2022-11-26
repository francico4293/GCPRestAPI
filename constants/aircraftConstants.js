'use strict';

const MIN_AIRCRAFT_WINGSPAN = 2;

const MAX_AIRCRAFT_WINGSPAN = 150;

const AIRCRAFT_MAKE_REGEX = /^[A-Za-z ]+$/;

const AIRCRAFT_MODEL_REGEX = /^[A-Za-z0-9 -/]+$/;

const OWNER_ID = 'ownerId';

const MAKE = 'make';

const MODEL = 'model';

const WINGSPAN = 'wingspan';

module.exports = { 
    MIN_AIRCRAFT_WINGSPAN,
    MAX_AIRCRAFT_WINGSPAN, 
    AIRCRAFT_MAKE_REGEX, 
    AIRCRAFT_MODEL_REGEX,
    OWNER_ID,
    MAKE,
    MODEL,
    WINGSPAN
};
