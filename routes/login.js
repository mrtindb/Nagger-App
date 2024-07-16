
'use strict';

const express = require('express');
const routes = express.Router();
const { comparePasswords } = require('../passwordhashing');
const { extractUserPassword } = require('../database');
const createJwt = require('../createjwt');

routes.get('/', async (req, res) => {
    res.render('login', {invalidCredentials: false});
});

routes.post('/', async (req, res) => {
    const {username, password} = req.body;
    let email = username;

    const hashedPassword = await extractUserPassword(username, email);
    if(hashedPassword === "error") {
        res.render('login', {invalidCredentials: true});
        return;
    }

    let match = await comparePasswords(password, hashedPassword[0].password);
    let userId = hashedPassword[0].userId;
    if(match) {
        const token = createJwt(userId, username, email);
        res.cookie('jwt', token, {httpOnly: true, secure: true});
        res.redirect('/home');
    }
    else {
        res.render('login', {invalidCredentials: true});
    }

});
module.exports = routes;