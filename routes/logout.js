
'use strict';

const express = require('express');
const routes = express.Router();

routes.get('/', async (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

module.exports = routes;