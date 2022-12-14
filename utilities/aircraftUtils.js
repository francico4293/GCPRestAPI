'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment5/blob/main/utilities/utils.js
// AUTHOR: Colin Francis
// DESCRIPTION: The above source as part of my submission for assignment 5 for CS493 this quarter was referenced while the
//      functions below were written. Source code is available upon request.

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
    MIN_STRING_LENGTH,
    MAX_STRING_LENGTH
} = require('../constants/commonConstants');

/**
 * Validates that the aircraft make value is valid.
 * @param {string} make - The make of the aircraft. 
 * @returns - True if the make value is valid. Otherwise, false.
 */
const isMakeValid = (make) => {
    // verify that make was provided in request body
    if (make === null || make === undefined) return false;

    // verify make is of type string
    if (typeof make !== STRING) return false;

    // verify make is of valid length
    if (make.length < MIN_STRING_LENGTH || make.length > MAX_STRING_LENGTH) return false;

    // verify make is not all spaces
    if (make.trim().length === 0) return false;

    // verify make contains valid characters
    if (!AIRCRAFT_MAKE_REGEX.test(make)) return false;

    // make is valid
    return true;
}

/**
 * Validates that the aircraft model value is valid.
 * @param {string} model - The model of the aircraft.
 * @returns - True if the model value is valid. Otherwise, false.
 */
const isModelValid = (model) => {
    // verify that model was provided in request body
    if (model === null || model === undefined) return false;

    // verify model is of type string
    if (typeof model !== STRING) return false;

    // verify model is of valid length
    if (model.length < MIN_STRING_LENGTH || model.length > MAX_STRING_LENGTH) return false;

    // verify model is not all spaces
    if (model.trim().length === 0) return false;

    // verify model contains valid characters
    if (!AIRCRAFT_MODEL_REGEX.test(model)) return false;

    // model is valid
    return true;
}

/**
 * Validates that the aircraft wingspan value is valid.
 * @param {number} wingspan - The wingspan of the aircraft. 
 * @returns - True if the wingspan value is valid. Otherwise, false.
 */
const isWingspanValid = (wingspan) => {
    // verify length was provided in request body
    if (wingspan === null || wingspan === undefined) return false;

    // verify length is of type number
    if (typeof wingspan !== NUMBER) return false;

    // determine valid length range
    if (wingspan < MIN_AIRCRAFT_WINGSPAN || wingspan > MAX_AIRCRAFT_WINGSPAN) return false;

    // length is valid
    return true;
}

// exports
module.exports = { 
    isMakeValid, 
    isModelValid,
    isWingspanValid
};
