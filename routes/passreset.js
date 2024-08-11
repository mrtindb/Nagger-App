'use strict';

const express = require('express');
const routes = express.Router();
const { checkEmailAvailability, storeURLToken, existsToken, changePassword } = require('../database');
const sendMail = require('../mail');
const crypto = require('crypto');
const path = require('path');
const { hashPassword } = require('../passwordhashing');


routes.get('/favicon.svg', (req, res) => {
    console.log('dogs');
    res.sendFile(path.join(__dirname, 'public/favicon.svg'));  // Adjust the path based on your project structure
});


//Getting the page to reset the password
routes.get('/', async (req, res) => {
    res.render('passreset');
});

//Creating the URL Token and sending Email (sent from the form in the passreset page)
routes.post('/', async (req, res) => {
    const address = req.body.address;
    let userExists = await checkEmailAvailability(address);
    if (userExists) {
        res.sendStatus(204);
        return;
    }
    const token = crypto.randomBytes(40).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
    sendMail(address, token);
    storeURLToken(address, token);
    res.sendStatus(200);
})

//Opening the page to set the new password (sent from the email)
routes.get('/:to', async (req, res) => {
    const token = req.params.to;
    console.log(token);
    if(token.length===0) {res.redirect('/passreset'); return;}
    let email = await existsToken(token);
    console.log(email);
    if (email === false) {
        res.render('invalid-token');
        return;
    }
    res.cookie('token', token, {secure: true, httpOnly: true});
    res.render('new-password');

});


//Sending the new password (sent from the form in the new-password page)
routes.post('/set', async (req, res) => {
    let token = req.cookies.token;
    res.clearCookie('token');
    let email = await existsToken(token);
    if (email === false) {
        res.render('invalid_token');
        return;
    }
    let password = req.body.password;
    console.log(password);
    const hashedPassword = await hashPassword(password);
    let r = await changePassword(email,hashedPassword);
    if(r==='ok') {
        res.render('pass-changed');
        return;
    }
    res.sendStatus(400);
})

module.exports = routes;