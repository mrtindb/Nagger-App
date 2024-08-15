
'use strict';

const express = require('express');
const routes = express.Router();
const createJwt = require('../createjwt');
const { addUserToDatabase, checkEmailAvailability, checkUsernameAvailability, addDevice } = require('../database');
const { hashPassword } = require('../passwordhashing');
const { body, validationResult, matchedData } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

//Validated
routes.get('/', async (req, res) => {
    res.render('register', { errorFlag: false, errorMessage: "" });
});

//Validated
routes.post('/',
    
    body('username').isString().isLength({ min: 3, max: 99 }),
    body('email').isLength({min:3,max:99}).isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 49 }),

    async (req, res) => {

    if (!validationResult(req).isEmpty()) {
        res.render('register', { errorFlag: true, errorMessage: "Invalid input" });
        return;
    }
    const { username, email, password } = matchedData(req);

    //TODO: Add validation for incoming data
    let emailExists = await checkEmailAvailability(email);

    if (!emailExists) {
        res.render('register', { errorFlag: true, errorMessage: "Email already in use" });
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