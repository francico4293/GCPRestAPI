'use strict';

// imports
const { decodeIdToken } = require('../utilities/authUtils');

/**
 * Middleware used to validate a JSON web token. If a provided JWT is valid, the middleware
 * will create a jwt attribute in the request object and will set the attribute equal to the
 * decoded JWT object. If the provided JWT is invalid or missing, the middleware will create
 * a jwt attribute in the request object and will set its value to null.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - A function used to move to the next piece of middleware.
 */
const isJwtValid = async (req, res, next) => {
    try {
        // get just the token/jwt from the Bearer Token authorization header
        const idToken = req.headers.authorization.replace('Bearer ', '');
        // decode the token/jwt
        req.jwt = await decodeIdToken(idToken);
    } catch (err) {
        // an error will be thrown for an invalid or missing jwt, set jwt attribute to null
        req.jwt = null;
    }
    
    // move to next piece of middleware
    next();
}

// exports
module.exports = { isJwtValid };
