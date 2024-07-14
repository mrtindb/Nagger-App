
'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const path = require('path');

routes.get('/', async (req, res) => {
    res.render('login', {invalidCredentials: false});
});

routes.post('/', async (req, res) => {
    const {username, email, password} = req.body;
    res.render('login', {invalidCredentials: true});
    //password.hash() //TODO: Implement password hashing

    //const userId = getUserIdFromDatabase(username, password); //TODO: Implement getUserIdFromDatabase

});
module.exports = routes;