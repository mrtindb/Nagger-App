'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');


require('express-async-errors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const home = require('./routes/home');
const devices = require('./routes/devices');
const register = require('./routes/register');
const login = require('./routes/login');
const logout = require('./routes/logout');
const account = require('./routes/account');
const webpush = require('web-push');
const useragent = require('express-useragent');
const app = express();

webpush.setVapidDetails(
    `mailto:${process.env.EMAIL}`,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'resources')));
app.use(useragent.express());
app.use('/', home);
app.use('/home', home);
app.use('/devices', devices);
app.use('/register', register);
app.use('/login', login);
app.use('/logout', logout);
app.use('/account', account);   
app.get('/about', (req, res) => {res.render('about')});

const database = require('./database');
const { req } = require('agent-base');
database.connectToDatabase();


module.exports = app;

setInterval(() => {}, )