
'use strict';

const express = require('express');
const routes = express.Router();
const createJwt = require('../createjwt');
const { addUserToDatabase, checkEmailAvailability, checkUsernameAvailability, addDevice } = require('../database');
const { hashPassword } = require('../passwordhashing');

routes.get('/', async (req, res) => {
    res.render('register', {errorFlag: false, errorMessage: ""});
});

routes.post('/', async (req, res) => {
    const {username, email, password} = req.body;
    const deviceID = req.cookies.deviceID;
    
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
    /*
    if(!deviceID){
        deviceID = uuidv4();
    }
        const expiryDate = new Date(2037, 0, 1);
        res.cookie('deviceID', deviceID, {httpOnly:true, secure:true, expires: expiryDate});
        await addDevice(user, deviceID, req.useragent);
    */
    
    res.redirect('/home');
});
module.exports = routes;