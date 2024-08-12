
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { cookie } = require('express-validator');
const { getAccountCreationDate } = require('../database');

routes.get('/',cookie('jwt').notEmpty().bail().isString().escape() , jwtMiddleware ,async (req, res) => {
    let userId = req.user.userId;
    let creationDate = await getAccountCreationDate(userId);
    res.render('account');

});
module.exports = routes;