'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const {extractDevices} = require('../database');

routes.get('/', jwtMiddleware, async (req, res) => {
    let userId = req.user.userId;
    let devices = JSON.parse(await extractDevices(userId));
    console.log(devices);
    res.render('devices', {devices});
});

module.exports = routes;