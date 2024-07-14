
'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const path = require('path');

routes.get('/', async (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

module.exports = routes;