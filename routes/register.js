
'use strict';

const express = require('express');
const routes = express.Router();
const createJwt = require('../createjwt');
const { addUserToDatabase, checkEmailAvailability, checkUsernameAvailability, addDevice } = require('../database');
const { hashPassword } = require('../passwordhashing');
const { body, validationResult, matchedData } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

//Validated
routes.get('/', async (req, res) => {
    res.render('register', { errorFlag: false, errorMessage: "", siteKey: process.env.RECAPTCHA_SITE_KEY });
});

//Validated
routes.post('/',

    body('username').isString().isLength({ min: 3, max: 99 }),
    body('email').isLength({ min: 3, max: 99 }).isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 49 }),

    async (req, res) => {

        if (!validationResult(req).isEmpty()) {
            res.render('register', { errorFlag: true, errorMessage: "Invalid input", siteKey: process.env.RECAPTCHA_SITE_KEY });
            return;
        }
        const { username, email, password } = matchedData(req);
        const recaptchaResponse = req.body['g-recaptcha-response'];
        console.log(recaptchaResponse);
        const secret = process.env.RECAPTCHA_SECRET;
        const params = new URLSearchParams();
        params.append('secret', secret);
        params.append('response', recaptchaResponse);
        fetch(`https://www.google.com/recaptcha/api/siteverify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        }).then(res => res.json()).then(json => {console.log(json);});
  
        //TODO: Add validation for incoming data
        let emailExists = await checkEmailAvailability(email);

        if (!emailExists) {
            res.render('register', { errorFlag: true, errorMessage: "Email already in use", siteKey: process.env.RECAPTCHA_SITE_KEY });
            return;
        }

        const hashedPassword = await hashPassword(password);
        const promise = await addUserToDatabase(username, email, hashedPassword);
        let user = promise[0].userId;
        const token = createJwt(user, username, email);

        res.cookie('jwt', token, { httpOnly: true, secure: true });
        res.redirect('/home');
    });
module.exports = routes;