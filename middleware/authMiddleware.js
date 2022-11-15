'use strict';

// imports
const { decodeIdToken } = require('../utilities/authUtils');

const isJwtValid = async (req, res, next) => {
    try {
        const idToken = req.headers.authorization.replace('Bearer ', '');
        req.jwt = await decodeIdToken(idToken);
    } catch (err) {
        req.jwt = null;
    }
    
    next();
}

// exports
module.exports = { isJwtValid };
