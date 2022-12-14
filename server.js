'use strict';

// imports
const express = require('express');
const { engine } = require('express-handlebars');
const authRouter = require('./routers/authRouter');
const usersRouter = require('./routers/usersRouter');
const aircraftsRouter = require('./routers/aircraftsRouter');
const hangarsRouter = require('./routers/hangarsRouter');
const { 
    HBS, 
    VIEW_ENGINE,
    MAIN, 
    LOGIN
} = require('./constants/handlebarConstants');
const { 
    PUBLIC,
    TRUST_PROXY
} = require('./constants/serverConstants');
const { HTTP_500_INTERNAL_SERVER_ERROR } = require('./constants/statusCodes');

// initialize new express application
const app = express();

// handlebars setup
app.engine(HBS, engine({ defaultLayout: MAIN, extname: HBS }));
app.set(VIEW_ENGINE, HBS);

// app setup
app.enable(TRUST_PROXY);
app.use(express.json());
app.use(express.static(__dirname + '/' + PUBLIC));

// routers
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/aircrafts', aircraftsRouter);
app.use('/hangars', hangarsRouter);

app.get('/', (req, res) => {
    res.render(LOGIN);
});

// general error handling for internal server errors
app.use((err, req, res, next) => {
    console.error(err);
    res.status(HTTP_500_INTERNAL_SERVER_ERROR)
        .json({ 'Error': 'An internal server error has occurred' });
});

// set server to listen on PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[+] Server listening on port ${PORT}...`);
});
