'use strict';

const MIN_AIRCRAFT_LENGTH = 9;

const MAX_AIRCRAFT_LENGTH = 500;

const AIRCRAFT_MAKE_REGEX = /^[A-Za-z\s]+$/;

const AIRCRAFT_MODEL_REGEX = /^[A-za-z\s0-9]+$/;

module.exports = { 
    MIN_AIRCRAFT_LENGTH,
    MAX_AIRCRAFT_LENGTH, 
    AIRCRAFT_MAKE_REGEX, 
    AIRCRAFT_MODEL_REGEX 
};
