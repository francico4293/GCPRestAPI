'use strict';

const STRING = 'string';

const AIRCRAFT_MODEL_REGEX = /^[A-Za-z\s]+$/;

const AIRCRAFT_MAKE_REGEX = /^[A-za-z\s0-9]+$/;

const INVALID_SPACING_REGEX = /\s+/;

const SPACE_CHAR = ' ';

module.exports = {
    STRING,
    AIRCRAFT_MODEL_REGEX,
    AIRCRAFT_MAKE_REGEX,
    INVALID_SPACING_REGEX,
    SPACE_CHAR
};
