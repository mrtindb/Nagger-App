'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { extractDevices, changeDeviceState } = require('../database');
const { cookie, body, validationResult, matchedData } = require('express-validator');

//Validated
routes.get('/', cookie('jwt').notEmpty().bail().isString(), jwtMiddleware, async (req, res) => {
    //Comes from jwtMiddleware
    let userId = req.user.userId;
    let devices = JSON.parse(await extractDevices(userId));
    res.render('devices', { devices });
});

//Validated
routes.put('/changeState', 
    
    cookie('jwt').notEmpty().bail().isString(),
    body('deviceId').isString().isUUID(),
    body('state').isBoolean(),

    jwtMiddleware,
    async (req, res) => {
    //Comes from jwtMiddleware
    let userId = req.user.userId;
    if(validationResult(req).isEmpty() === false) {
        res.status(400).send('Bad Request');
        return;
    }
    const { deviceId, state } = matchedData(req);
    changeDeviceState(userId, deviceId, state);
    res.sendStatus(204);
});

module.exports = routes;