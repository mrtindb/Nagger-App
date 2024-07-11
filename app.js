'use strict';

const express = require('express');
const path = require('path');

require('express-async-errors');
const cookieParser = require('cookie-parser');

const home = require('./routes/home');
const devices = require('./routes/devices');
const app = express();;

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'resources')));
app.use('/', home);
app.use('/home', home);
app.use('/devices', devices);
module.exports = app;