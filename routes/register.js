
'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const path = require('path');
const createJwt = require('../createjwt');
const { addUserToDatabase } = require('../database');

routes.get('/', async (req, res) => {
    res.render('register');
});

routes.post('/', async (req, res) => {
    const {username, email, password} = req.body;

    //TODO: Add validation for incoming data

    const userId = addUserToDatabase(username, email, password);
    const token = createJwt(userId, username, email);

    res.cookie('jwt', token, {httpOnly: true, secure: true});
    
    res.json({status: 'success', token: token});
});
module.exports = routes;