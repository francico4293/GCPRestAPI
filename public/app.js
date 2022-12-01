'use strict';

// ***** GENERAL CODE CITATION / REFERENCE *****
// SOURCE: https://github.com/francico4293/CS493-Assignment6/blob/main/public/app.js
// AUTHOR: Colin Francis
// DESCRIPTION: I referenced code I wrote as part of Assignment 6 while developing the functions below. Source
//      code is available upon request.

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
// ***** BEGIN CITED CODE *****
// The following code is not my own
// SOURCE: https://canvas.oregonstate.edu/courses/1890665/pages/exploration-asynchronous-programming-motivation-optional?module_item_id=22486437
// SOURCE: https://replit.com/@coecs290/m611#public/ajax.js
// AUTHOR: Oregon State University
// The following code adds an event listened that fires when all DOM content loads. The event listener itself
// gets the login button by its ID. If we're on the page where there is a login button with an ID of 'login',
// then an event listened is added to the login in button that fires when the button is clicked. The event
// listener on the login button is set to execute the redirectToOauthProvider function when the login button
// is clicked.
window.addEventListener('DOMContentLoaded', () => {
    // get login button by id
    const loginButton = document.getElementById('login');

    // if login button exists, add event listener to fire on click
    if (loginButton !== null) {
        loginButton.addEventListener('click', redirectToOauthProvider);
    }
});
// ***** END CITED CODE *****
