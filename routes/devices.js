'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const {extractDevices} = require('../database');
const { cookie } = require('express-validator');

routes.get('/', cookie('jwt').notEmpty().bail().isString().escape() ,jwtMiddleware, async (req, res) => {
    let userId = req.user.userId;
    let devices = JSON.parse(await extractDevices(userId));
    res.render('devices', {devices});
});

module.exports = routes;