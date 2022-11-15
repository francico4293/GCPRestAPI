'use strict';

// imports
const express = require('express');
const { engine } = require('express-handlebars');
const authRouter = require('./routers/authRouter');
const usersRouter = require('./routers/usersRouter');
const { 
    HBS, 
    VIEW_ENGINE,
    MAIN, 
    LOGIN
} = require('./constants/handlebarConstants');
const { 
    PUBLIC,
} = require('./constants/commonConstants');

// initialize new express application
const app = express();

// handlebars setup
app.engine(HBS, engine({ defaultLayout: MAIN, extname: HBS }));
app.set(VIEW_ENGINE, HBS);

// app setup
app.use(express.json());
app.use(express.static(__dirname + '/' + PUBLIC));

// routers
app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
    res.render(LOGIN);
});

// set server to listen on PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[+] Server listening on port ${PORT}...`);
});
