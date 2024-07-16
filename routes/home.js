
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const {getUserNaggers} = require('../database');

routes.get('/', jwtMiddleware ,async (req, res) => {
    
    const userData = req.user;
    const naggers = await getUserNaggers(userData.userId);
    if(naggers.length === 0) {
    res.render('home');
    }
    else {
        res.render('home', {naggers});
    }
});

routes.put('/addNagger', jwtMiddleware, async (req, res) => {
    
});

module.exports = routes;