
'use strict';

const express = require('express');
const routes = express.Router();
const createJwt = require('../createjwt');
const { addUserToDatabase, checkEmailAvailability, checkUsernameAvailability } = require('../database');
const { hashPassword } = require('../passwordhashing');

routes.get('/', async (req, res) => {
    res.render('register', {errorFlag: false, errorMessage: ""});
});

routes.post('/', async (req, res) => {
    const {username, email, password} = req.body;

    
    //TODO: Add validation for incoming data

    let userExists = await checkUsernameAvailability(username);
    let emailExists = await checkEmailAvailability(email);

    if(!userExists && !emailExists) {
        res.render('register', {errorFlag: true, errorMessage: "Username and email already in use"});
        return;
    }
    if(!userExists) {
        res.render('register', {errorFlag: true, errorMessage: "Username already in use"});
        return;
    }
    if(!emailExists) {
        res.render('register', {errorFlag: true, errorMessage: "Email already in use"});
        return;
    }


    const hashedPassword = await hashPassword(password);
    const promise = await addUserToDatabase(username, email, hashedPassword);
    let user = promise[0].userId;
    const token = createJwt(user, username, email);

    res.cookie('jwt', token, {httpOnly: true, secure: true});
    
    res.redirect('/home');
});
module.exports = routes;