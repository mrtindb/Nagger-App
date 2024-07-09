'use strict';

const express = require('express');
const path = require('path');

require('express-async-errors');
const cookieParser = require('cookie-parser');

const mainRoutes = require('./routes/main');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/main', mainRoutes);
app.use(express.static(path.join(__dirname, 'resources')));


module.exports = app;