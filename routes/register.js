
'use strict';

const express = require('express');
const routes = express.Router();
const fetch = require('node-fetch');
const path = require('path');

routes.get('/', async (req, res) => {
    res.render('register');
});

routes.post('/', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    
    res.redirect('/home');
});
module.exports = routes;