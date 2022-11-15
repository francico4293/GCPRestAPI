'use strict';

// imports
const express = require('express');
const { engine } = require('express-handlebars');
const authRouter = require('./routers/authRouter');
const { 
    MAIN, 
    LOGIN 
} = require('./constants/handlebarConstants');
const { 
    PUBLIC, 
    HBS, 
    VIEW_ENGINE
} = require('./constants/configConstants');

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

app.get('/', (req, res) => {
    res.render(LOGIN);
});

// set server to listen on PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[+] Server listening on port ${PORT}...`);
});
