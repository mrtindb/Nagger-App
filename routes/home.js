
'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const path = require('path');
const jwtMiddleware = require('../jwtMiddleware');

routes.get('/', jwtMiddleware ,async (req, res) => {
    res.render('home', {token: req.user});
});
module.exports = routes;