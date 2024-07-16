
'use strict';

const express = require('express');
const routes = express.Router();
const createJwt = require('../createjwt');
const { addUserToDatabase } = require('../database');
const { hashPassword } = require('../passwordhashing');

routes.get('/', async (req, res) => {
    res.render('register');
});

routes.post('/', async (req, res) => {
    const {username, email, password} = req.body;

    //TODO: Add validation for incoming data
    const hashedPassword = await hashPassword(password);
    const promise = await addUserToDatabase(username, email, hashedPassword);
    let user = promise[0].userId;
    const token = createJwt(user, username, email);

    res.cookie('jwt', token, {httpOnly: true, secure: true});
    
    res.redirect('/home');
});
module.exports = routes;