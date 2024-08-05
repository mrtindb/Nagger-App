'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const {extractDevices, changeDeviceState} = require('../database');
const { cookie } = require('express-validator');

routes.get('/', cookie('jwt').notEmpty().bail().isString().escape() ,jwtMiddleware, async (req, res) => {
    let userId = req.user.userId;
    let devices = JSON.parse(await extractDevices(userId));
    res.render('devices', {devices});
});

routes.put('/changeState', cookie('jwt').notEmpty().bail().isString().escape() ,jwtMiddleware, async (req, res) => {
    let userId = req.user.userId;
    let body = req.body;
    changeDeviceState(userId, body.deviceId, body.state);
    res.sendStatus(204);
    
});

module.exports = routes;