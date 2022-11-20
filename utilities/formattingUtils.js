'use strict';

// imports
const { 
    INVALID_SPACING_REGEX,
    SPACE_CHAR,
 } = require('../constants/commonConstants');

/**
 * Removes an leading and trailing spaces from a string. Replaces any extra spacing with a single space 
 *  character.
 * @param {string} string - The string to remove extra spacing from.
 * @returns - The string with all leading and trailing spaces removed and all extra spacing replaced with
 *      a single space character.
 */
 const removeExtraSpacingFromString = (string) => {
    // remove leading and trailing white space
    string = string.trim();

    // remove any spacing greater than 1 space with a single space char
    return string.replace(INVALID_SPACING_REGEX, SPACE_CHAR);
}

// exports
module.exports = { removeExtraSpacingFromString };
