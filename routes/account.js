
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { cookie } = require('express-validator');
routes.get('/',cookie('jwt').notEmpty().bail().isString().escape() , jwtMiddleware ,async (req, res) => {
    
    res.render('home');
});
module.exports = routes;