'use strict';

// imports
const express = require('express');

// initialize new express application
const app = express();

// set server to listen on PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[+] Server listening on port ${PORT}...`);
});
