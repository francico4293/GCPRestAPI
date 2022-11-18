'use strict';

/**
 * Used to redirect the end-user to the Google OAuth 2.0 authorization endpoint.
 */
const redirectToOauthProvider = async () => {
    try {
        // send HTTP GET request for url to redirect end-user to Google OAuth 2.0 endpoint
        const response = await fetch('/auth/authorization-url');

        if (response.status === 200) {
            // extract url from response body
            const authorizationUrl = await response.text();
            // redirect user to Google OAuth 2.0 endpoint
            location.href = authorizationUrl;
        } else {
            // alert user of redirection failure
            alert('Unable to redirect to Google');
        }
    } catch (err) {
        // log error
        console.error(err);
        // alert user of redirection failure
        alert('Unable to redirect to Google');
    }
}

/**
 * Adds an event listener to the window that is fired when all DOM content is loaded. The event listener
 * registers another event listener on the login button is one exists. The login button event listener
 * will fire whent the button is clicked and will cause the redirectToOauthProvider function to execute.
 */
window.addEventListener('DOMContentLoaded', () => {
    // get login button by id
    const loginButton = document.getElementById('login');

    // if login button exists, add event listener to fire on click
    if (loginButton !== null) {
        loginButton.addEventListener('click', redirectToOauthProvider);
    }
});
