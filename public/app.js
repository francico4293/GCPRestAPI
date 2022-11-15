'use strict';

const redirectToOauthProvider = async () => {
    try {
        const response = await fetch('/auth/authorization-url');

        if (response.status === 200) {
            const authorizationUrl = await response.text();
            location.href = authorizationUrl;
        } else {
            alert('Unable to redirect to Google');
        }
    } catch (err) {
        alert('Unable to redirect to Google');
        console.error(err);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login');

    if (loginButton !== null) {
        loginButton.addEventListener('click', redirectToOauthProvider);
    }
});
