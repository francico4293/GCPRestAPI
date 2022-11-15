'use strict';

// imports
const { 
    HOST, 
    LOCAL_HOST 
} = require('../constants/commonConstants');

const isProd = (req) => {
    return !req.get(HOST).includes(LOCAL_HOST);
}

// exports
module.exports = { isProd };
