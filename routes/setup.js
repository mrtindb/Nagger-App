'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { extractDevices } = require('../database');
const { cookie, validationResult, matchedData } = require('express-validator');

routes.get('/',

    cookie('deviceID').optional().isUUID(),
    cookie('jwt').notEmpty().bail().isString(),
    jwtMiddleware,
    //cookie('set').default('false'),
    

    async (req, res) => {
        // If there are errors in the validation result, redirect
        if (!validationResult(req).isEmpty()) {
            return res.redirect('/login');
        }

        let deviceID = req.cookies.deviceID || "";
        let devices = JSON.parse(await extractDevices(req.user.userId)) || [];

        // Check if the deviceID is in the list of devices
        let x = devices.filter(device => device.deviceId === deviceID);
        let set = true;
        if (x.length === 0) {
            set = false;
        }
        
        // Render the setup page based on if the device is in the list
        res.render('setup', { set });
    });
module.exports = routes;