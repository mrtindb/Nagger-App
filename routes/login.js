
'use strict';

const express = require('express');
const routes = express.Router();
const { comparePasswords } = require('../passwordhashing');
const { extractUserPassword } = require('../database');
const createJwt = require('../createjwt');
const { body, validationResult, matchedData } = require('express-validator');

//Validated
routes.get('/', async (req, res) => {
    res.render('login', { invalidCredentials: false });
});

//Validated
routes.post('/', 
    
    body('username').isString().isLength({ min: 3, max: 49 }),
    body('password').isString().isLength({ min: 8, max: 49 }),

    async (req, res) => {
    //Username can be email or username
    if(!validationResult(req).isEmpty()){
        res.render('login', { invalidCredentials: true });
        return;
    }
    const { username, password } = matchedData(req);
    const email = username;
    const hashedPassword = await extractUserPassword(username, email);
    if (hashedPassword === "error") {
        res.render('login', { invalidCredentials: true });
        return;
    }
    let match = await comparePasswords(password, hashedPassword[0].password);
    let userId = hashedPassword[0].userId;
    if (match) {
        email = hashedPassword[0].email;
        const token = createJwt(userId, username, email);
        res.cookie('jwt', token, { httpOnly: true, secure: true });
        res.redirect('/home');
    }
    else {
        res.render('login', { invalidCredentials: true });
    }

});
module.exports = routes;