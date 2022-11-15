'use strict';

// imports
const { 
    HOST, 
    LOCAL_HOST 
} = require('../constants/commonConstants');

const isProd = (req) => {
    return !req.get(HOST).includes(LOCAL_HOST);
}

const isReqHeaderValid = (headerValue, ...permittedHeaderValues) => {
    return permittedHeaderValues.includes(headerValue);
}

const createSelfLink = (protocol, host, baseUrl, resourceId) => {
    return `${protocol}://${host}${baseUrl}/${resourceId}`;
}

// exports
module.exports = { 
    isProd, 
    isReqHeaderValid,
    createSelfLink
}
