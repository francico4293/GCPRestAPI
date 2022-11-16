'use strict';

// imports
const { 
    AIRCRAFT_MAKE_REGEX,
    AIRCRAFT_MODEL_REGEX,
    MAX_AIRCRAFT_WINGSPAN,
    MIN_AIRCRAFT_WINGSPAN
} = require('../constants/aircraftConstants');
const { 
    STRING, 
    NUMBER,
    INVALID_SPACING_REGEX,
    SPACE_CHAR
} = require('../constants/commonConstants');

const isMakeValid = (make) => {
    // verify that make was provided in request body
    if (make === null || make === undefined) return false;

    // verify make is of type string
    if (typeof make !== STRING) return false;

    // verify make is of valid length
    if (make.length < 1 || make.length > 255) return false;

    // verify make is not all spaces
    if (make.trim().length === 0) return false;

    // verify make contains valid characters
    if (!AIRCRAFT_MAKE_REGEX.test(make)) return false;

    // make is valid
    return true;
}

const isModelValid = (model) => {
    // verify that model was provided in request body
    if (model === null || model === undefined) return false;

    // verify model is of type string
    if (typeof model !== STRING) return false;

    // verify model is of valid length
    if (model.length < 1 || model.length > 255) return false;

    // verify model is not all spaces
    if (model.trim().length === 0) return false;

    // verify model contains valid characters
    if (!AIRCRAFT_MODEL_REGEX.test(model)) return false;

    // model is valid
    return true;
}

const isWingspanValid = (length) => {
    // verify length was provided in request body
    if (length === null || length === undefined) return false;

    // verify length is of type number
    if (typeof length !== NUMBER) return false;

    // determine valid length range
    if (length < MIN_AIRCRAFT_WINGSPAN || length > MAX_AIRCRAFT_WINGSPAN) return false;

    // length is valid
    return true;
}

const removeExtraSpacingFromString = (string) => {
    // remove leading and trailing white space
    string = string.trim();

    // remove any spacing greater than 1 space with a single space char
    return string.replace(INVALID_SPACING_REGEX, SPACE_CHAR);
}

// exports
module.exports = { 
    isMakeValid, 
    isModelValid,
    isWingspanValid,
    removeExtraSpacingFromString 
};
