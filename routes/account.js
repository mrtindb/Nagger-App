
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');

routes.get('/', jwtMiddleware ,async (req, res) => {
    res.render('account');
});
module.exports = routes;