'use strict';

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

window.addEventListener('DOMContentLoaded', () => {
    // get login button by id
    const loginButton = document.getElementById('login');

    // if login button exists, add event listener to fire on click
    if (loginButton !== null) {
        loginButton.addEventListener('click', redirectToOauthProvider);
    }
});
