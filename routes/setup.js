'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { extractDevices } = require('../database');
const { cookie, validationResult,matchedData } = require('express-validator');


routes.get('/', 

    cookie('jwt').notEmpty().bail().isString().escape(),  
    jwtMiddleware , 
    cookie('set').default('false'),
    cookie('deviceID').optional().isUUID(),

    async (req, res) => {
    let set = matchedData(req).set;

    if(!validationResult(req).isEmpty() ||(set!=='true' && set!=='false')) {
        console.log(validationResult(req));
        return res.redirect('/login');
    }
    
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