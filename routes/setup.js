'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { extractDevices } = require('../database');

routes.get('/', jwtMiddleware ,async (req, res) => {
    let set = req.cookies.set;
    let deviceID = req.cookies.deviceID || "";
    let devices = JSON.parse(await extractDevices(req.user.userId)) || [];

    let x = devices.filter(device => device.deviceId === deviceID);

    if (x.length == 0) {
        set = false;
    }

    set = set=="true"?true:false;
    res.render('setup', { set });
});
module.exports = routes;