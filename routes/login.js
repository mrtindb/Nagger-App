
'use strict';
require('dotenv').config();
const express = require('express');
const routes = express.Router();
const { comparePasswords } = require('../passwordhashing');
const { extractUserPassword } = require('../database');
const createJwt = require('../createjwt');
const { body, validationResult, matchedData } = require('express-validator');

//Validated
routes.get('/', async (req, res) => {
    res.render('login', { invalidCredentials: false, siteKey: process.env.RECAPTCHA_SITE });
});

//Validated
routes.post('/', 
    
    body('email').isString().isLength({ min: 3, max: 99 }).isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 49 }),

    async (req, res) => {
    //Validation
    if(!validationResult(req).isEmpty()){
        res.render('login', { invalidCredentials: true });
        return;
    }

    const secret = process.env.RECAPTCHA_SECRET;
    const recaptchaResponse = req.body['g-recaptcha-response'];
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', recaptchaResponse);
    let response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    });
    const responseJson = await response.json();
    if(!responseJson.success) {
        res.render('login', { invalidCredentials: true, errorMessage: "Recaptcha failed. Please try again" });
        return;
    }
    if(responseJson.score < 0.5) {
        res.render('login', { invalidCredentials: true, errorMessage: "Recaptcha failed. Please try again" });
        return;
    }


    const email = matchedData(req).email;
    const password = req.body.password;
    
    const hashedPassword = await extractUserPassword(email);
    if (hashedPassword === "error") {
        res.render('login', { invalidCredentials: true, errorMessage: "Invalid email or password" });
        return;
    }
    let match = await comparePasswords(password, hashedPassword[0].password);
    let userId = hashedPassword[0].userId;
    if (match) {
        let name = hashedPassword[0].username;
        const token = createJwt(userId, name, email);
        res.cookie('jwt', token, { httpOnly: true, secure: true });
        res.redirect('/home');
    }
    else {
        res.render('login', { invalidCredentials: true, errorMessage: "Invalid email or password" });
    }

});
module.exports = routes;