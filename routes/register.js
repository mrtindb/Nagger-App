
'use strict';

require('dotenv').config();
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
    res.render('register', { errorFlag: false, errorMessage: "", siteKey: process.env.RECAPTCHA_SITE });
});

//Validated
routes.post('/',

    body('username').isString().isLength({ min: 3, max: 99 }),
    body('email').isLength({ min: 3, max: 99 }).isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 49 }),

    async (req, res) => {
        //Check if input is valid
        if (!validationResult(req).isEmpty()) {
            res.render('register', { errorFlag: true, errorMessage: "Invalid input", siteKey: process.env.RECAPTCHA_SITE });
            return;
        }


        //Recaptcha logic
        const recaptchaResponse = req.body['g-recaptcha-response'];
        const secret = process.env.RECAPTCHA_SECRET;
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
            res.render('register', { errorFlag: true, errorMessage: "Recaptcha failed. Please try again", siteKey: process.env.RECAPTCHA_SITE });
            return;
        }
        if(responseJson.score < 0.5) {
            res.render('register', { errorFlag: true, errorMessage: "Recaptcha failed. Please try again", siteKey: process.env.RECAPTCHA_SITE });
            return;
        }


        const { username, email, password } = matchedData(req);
        let emailExists = await checkEmailAvailability(email);
        //Check if email is already in use
        if (!emailExists) {
            res.render('register', { errorFlag: true, errorMessage: "Email already in use" , siteKey: process.env.RECAPTCHA_SITE });
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