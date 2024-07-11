
'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const path = require('path');

routes.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '../resources/home.html'))
});
module.exports = routes;