'use strict';

// imports
const express = require('express');
const authRouter = require('./routers/authRouter');

// initialize new express application
const app = express();

// routers
app.use('/auth', authRouter);

app.get('/', (req, res) => {

});

// set server to listen on PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[+] Server listening on port ${PORT}...`);
});
