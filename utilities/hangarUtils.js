'use strict';

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

// TODO: Add regex validation for name and location

const isNameValid = (name) => {
    if (name === null || name === undefined) return false;

    if (typeof name !== STRING) return false;

    if (name.length < MIN_STRING_LENGTH || name.length > MAX_STRING_LENGTH) return false;

    if (name.trim().length === 0) return false;

    // verify name contains valid characters
    if (!HANGAR_NAME_REGEX.test(name)) return false;

    return true;
}

const isCityValid = (city) => {
    if (city === null || city === undefined) return false;

    if (typeof city !== STRING) return false;

    if (city.length < MIN_STRING_LENGTH || city.length > MAX_STRING_LENGTH) return false;

    if (city.trim().length === 0) return false;

    // verify make contains valid characters
    if (!HANGAR_CITY_REGEX.test(city)) return false;

    return true;
}

const isStateValid = (state) => {
    if (state === null || state === undefined) return false;

    if (typeof state !== STRING) return false;

    if (state.length < MIN_STRING_LENGTH || state.length > MAX_STRING_LENGTH) return false;

    if (state.trim().length === 0) return false;

    // verify make contains valid characters
    if (!HANGAR_STATE_REGEX.test(state)) return false;

    return true;
}

const isCapacityValid = (capacity) => {
    if (capacity === null || capacity === undefined) return false;

    if (typeof capacity !== NUMBER) return false;

    if (capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) return false;

    return true;
}

const createAircraftObjectsArray = (req, aircraftIds) => {
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
