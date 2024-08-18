'use strict';

const express = require('express');
const routes = express.Router();
const { checkEmailAvailability, storeURLToken, existsToken, changePassword, invalidateURLToken, accountEditDate } = require('../database');
const sendMail = require('../mail');
const crypto = require('crypto');
const path = require('path');
const { body, validationResult, matchedData, cookie, param } = require('express-validator');
const { hashPassword } = require('../passwordhashing');

//Getting the page to reset the password
routes.get('/', async (req, res) => {
    res.render('passreset');
});

//Creating the URL Token and sending Email (sent from the form in the passreset page)
routes.post('/',
    body('address').isLength({ min: 3, max: 99 }).isEmail().normalizeEmail(),
    async (req, res) => {
        //Validation
        if (!validationResult(req).isEmpty()) {
            res.sendStatus(204);
            return;
        }

        //Recaptcha logic
        const secret = process.env.RECAPTCHA_SECRET;
        const recaptchaResponse = req.body.token;
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
        if (!responseJson.success) {
            res.sendStatus(204);
            return;
        }

        if (responseJson.score < 0.5) {
            res.sendStatus(204);
            return;
        }

        const address = matchedData(req).address;
        let userExists = await checkEmailAvailability(address);
        if (userExists) {
            res.sendStatus(204);
            return;
        }

        //All checks passed, creating the token and sending the email
        const token = crypto.randomBytes(40).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
        sendMail(address, token);
        storeURLToken(address, token);
        res.sendStatus(204);
    });

//Opening the page to set the new password (sent from the email)
routes.get('/:to',

    param('to').isString().isLength({ min: 40, max: 40 }),

    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            res.render('invalid-token');
            return;
        }
        const token = req.params.to;
        if (token.length === 0) { res.redirect('/passreset'); return; }
        let email = await existsToken(token);
        if (email === false) {
            res.render('invalid-token');
            return;
        }
        let expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 15);
        res.cookie('token', token, { secure: true, httpOnly: true , expires: expiryDate});
        res.render('new-password');

    });


//Sending the new password (sent from the form in the new-password page)
routes.post('/set',

    cookie('token').notEmpty().bail().isString().isLength({ min: 40, max: 40 }),
    body('password').isString().isLength({ min: 8, max: 49 }),

    async (req, res) => {
        //Validation
        if (!validationResult(req).isEmpty()) {
            res.clearCookie('token');
            res.sendStatus(400);
            return;
        }

        // the token must be deleted and invalidated even if the request is spammy or from a bot,
        // so this code executes before the recaptcha check
        let token = req.cookies.token;
        res.clearCookie('token');
        let email = await existsToken(token);
        if (email === false) {
            res.render('invalid-token');
            return;
        }
        invalidateURLToken(email);

        //recaptcha logic
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
        if (!responseJson.success) {
            res.clearCookie('token');
            res.status(400).send('Recaptcha failed');
            return;
        }
        if(responseJson.score < 0.5){
            res.clearCookie('token');
            res.status(400).send('Recaptcha failed');
            return;
        }
        //End of recaptcha logic

        
        //All checks passed, changing the password
        let password = req.body.password;
        const hashedPassword = await hashPassword(password);
        let r = await changePassword(email, hashedPassword);
        if (r === 'ok') {
            accountEditDate(email);
            res.render('pass-changed');
            return;
        }
        res.sendStatus(400);
    })

module.exports = routes;