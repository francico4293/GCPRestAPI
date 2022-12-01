'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment5/blob/main/utilities/utils.js
// AUTHOR: Colin Francis
// DESCRIPTION: The above source as part of my submission for assignment 5 for CS493 this quarter was referenced while the
//      functions below were written. Source code is available upon request.

// imports
const { createSelfLink } = require('../utilities/serverUtils');
const { 
    STRING, 
    NUMBER,
    MIN_STRING_LENGTH,
    MAX_STRING_LENGTH
} = require('../constants/commonConstants');
const { 
    MIN_CAPACITY,
    MAX_CAPACITY,
    HANGAR_NAME_REGEX,
    HANGAR_CITY_REGEX,
    HANGAR_STATE_REGEX
} = require('../constants/hangarConstants');
const { HOST } = require('../constants/serverConstants');

/**
 * Verifies that the specified name of the hangar is valid.
 * @param {string} name - The name of the hangar. 
 * @returns - True if hangar name attribute is valid. Otherwise, false.
 */
const isNameValid = (name) => {
    // verify that a name attribute was provided
    if (name === null || name === undefined) return false;

    // verify that the name attribute value is a string
    if (typeof name !== STRING) return false;

    // verify that the name attribute value is the correct length
    if (name.length < MIN_STRING_LENGTH || name.length > MAX_STRING_LENGTH) return false;

    // verify that the name attribute value is not all spaces
    if (name.trim().length === 0) return false;

    // verify name contains valid characters
    if (!HANGAR_NAME_REGEX.test(name)) return false;

    // name attribute value is valid
    return true;
}

/**
 * Verifies that the specified city of the hangar is valid.
 * @param {string} city - The city that the hangar is located in.
 * @returns - True if the city provided is valid. Otherwise, false.
 */
const isCityValid = (city) => {
    // verify that a city attribute was provided
    if (city === null || city === undefined) return false;

    // verify that the city attribute value is a string
    if (typeof city !== STRING) return false;

    // verify that the city attribute value is the correct length
    if (city.length < MIN_STRING_LENGTH || city.length > MAX_STRING_LENGTH) return false;

    // verify that the city attribute is not all spaces
    if (city.trim().length === 0) return false;

    // verify city contains valid characters
    if (!HANGAR_CITY_REGEX.test(city)) return false;

    // city attribute value is valid
    return true;
}

/**
 * Verifies that the specified state of the hangar is valid.
 * @param {string} state - The state that the hangar is located in. 
 * @returns - True if the state provided is valid. Otherwise, false.
 */
const isStateValid = (state) => {
    // verify that a state attribute was provided
    if (state === null || state === undefined) return false;

    // verify that the state attribute value is a string
    if (typeof state !== STRING) return false;

    // verify that the state attribute value is the correct length
    if (state.length < MIN_STRING_LENGTH || state.length > MAX_STRING_LENGTH) return false;

    // verify that the state attribute value is not all spaces
    if (state.trim().length === 0) return false;

    // verify state contains valid characters
    if (!HANGAR_STATE_REGEX.test(state)) return false;

    // state attribute value is valid
    return true;
}

/**
 * Verifies that the specified capacity of the hangar is valid.
 * @param {number} capacity - The maximum number of aircrafts the hangar can store. 
 * @returns - True if the capacity provided is valid. Otherwise, false.
 */
const isCapacityValid = (capacity) => {
    // verify that a capacity attribute was provided
    if (capacity === null || capacity === undefined) return false;

    // verify that the capacity attribute value is a number
    if (typeof capacity !== NUMBER) return false;

    // verify that the capacity attribute value is a correct value
    if (capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) return false;

    // capacity attribute value is valid
    return true;
}

/**
 * Generates an array of aircraft objects from the array of aircraftIds provided. The array created contains an object
 * for each aircraftId in the aircraftIds array. The objects contain the id of the aircraft and a self link for the 
 * aircraft.
 * @param {object} req - The HTTP request object. 
 * @param {array} aircraftIds - An array of aircraftIds.
 * @returns - An array of objects which have an id attribute and a self attribute. The id attribute value is the
 *      id of an aircraft and the self attribute value is the self-link for the aircraft.
 */
const createAircraftObjectsArray = (req, aircraftIds) => {
    // generate aircraft array
    return aircraftIds.map(aircraftId => (
        {
            id: aircraftId,
            self: createSelfLink(req.protocol, req.get(HOST), '/aircrafts', aircraftId)
        }
    ));
}

// exports
module.exports = { 
    isNameValid,
    isCityValid,
    isStateValid,
    isCapacityValid,
    createAircraftObjectsArray
};
