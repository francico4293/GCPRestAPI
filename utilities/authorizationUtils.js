'use strict';

// imports
const { google } = require('googleapis');
const clientCredentialsJson = require('../client-credentials.json');
const { 
    OFFLINE, 
    USER_INFO_PROFILE_SCOPE 
} = require('../constants/authorizationConstants');

const getOauthClient = (isProd) => {
    const redirectUriIdx = isProd ? 1 : 0;

    return new google.auth.OAuth2(
        clientCredentialsJson.web.client_id,
        clientCredentialsJson.web.client_secret,
        clientCredentialsJson.web.redirect_uris[redirectUriIdx]
    );
}

const getAuthorizationUrl = (isProd) => {
    const oauthClient = getOauthClient(isProd);

    return oauthClient.generateAuthUrl({
        access_type: OFFLINE,
        scope: USER_INFO_PROFILE_SCOPE,
        include_granted_scopes: true
    });
}

// exports
module.exports = { 
    getOauthClient, 
    getAuthorizationUrl 
};
