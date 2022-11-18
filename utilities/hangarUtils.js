'use strict';

// imports
const { 
    STRING, 
    NUMBER,
    MIN_STRING_LENGTH,
    MAX_STRING_LENGTH
} = require('../constants/commonConstants');
const { 
    MIN_CAPACITY,
    MAX_CAPACITY,
    HANGAR_NAME_LOCATION_REGEX
} = require('../constants/hangarConstants');

// TODO: Add regex validation for name and location

const isNameValid = (name) => {
    if (name === null || name === undefined) return false;

    if (typeof name !== STRING) return false;

    if (name.length < MIN_STRING_LENGTH || name.length > MAX_STRING_LENGTH) return false;

    if (name.trim().length === 0) return false;

    // verify name contains valid characters
    if (!HANGAR_NAME_LOCATION_REGEX.test(name)) return false;

    return true;
}

const isLocationValid = (location) => {
    if (location === null || location === undefined) return false;

    if (typeof location !== STRING) return false;

    if (location.length < MIN_STRING_LENGTH || location.length > MAX_STRING_LENGTH) return false;

    if (location.trim().length === 0) return false;

    // verify make contains valid characters
    if (!HANGAR_NAME_LOCATION_REGEX.test(location)) return false;

    return true;
}

const isCapacityValid = (capacity) => {
    if (capacity === null || capacity === undefined) return false;

    if (typeof capacity !== NUMBER) return false;

    if (capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) return false;

    return true;
}

// exports
module.exports = { 
    isNameValid,
    isLocationValid,
    isCapacityValid
};
