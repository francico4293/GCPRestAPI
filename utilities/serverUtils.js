'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment5/blob/main/utilities/utils.js
// AUTHOR: Colin Francis
// DESCRIPTION: isReqHeaderValid and createSelfLink functions were functions I created as part
//      of my assignment 5 submission for CS493 this quarter. I referenced my code written for
//      those functions in assignment 5 while working on them for this assignment. Source code
//      is available upon request

// imports
const { 
    HOST, 
    LOCAL_HOST 
} = require('../constants/serverConstants');

/**
 * Determines if the application is running in production or development.
 * @param {object} req - The request object.
 * @returns True if the application is running in production. Otherwise, false.
 */
const isProd = (req) => {
    // if the application is running in the development environment, the request host will
    // be localhost
    return !req.get(HOST).includes(LOCAL_HOST);
}

/**
 * Determines if a header value provided in the HTTP request is a permitted value.
 * @param {string} headerValue - The actual value of any request header.
 * @param  {...any} permittedHeaderValues - The permitted values of the request header.
 * @returns - True if the header value is a permitted value. Otherwise, false.
 */
const isReqHeaderValid = (headerValue, ...permittedHeaderValues) => {
    return permittedHeaderValues.includes(headerValue);
}

/**
 * Generated a self link for a resource.
 * @param {string} protocol - The protocol used in the request.
 * @param {string} host - The host that the request was sent to.
 * @param {string} baseUrl - The base URL representing the canonical representation of the
 *      resource.
 * @param {string} resourceId - The unique ID of the resource.
 * @returns - The self link for the resource.
 */
const createSelfLink = (protocol, host, baseUrl, resourceId) => {
    return `${protocol}://${host}${baseUrl}/${resourceId}`;
}

// exports
module.exports = { 
    isProd, 
    isReqHeaderValid,
    createSelfLink
}
