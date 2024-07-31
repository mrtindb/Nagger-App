
'use strict';

const express = require('express');
const routes = express.Router();
const { comparePasswords } = require('../passwordhashing');
const { extractUserPassword, addDevice } = require('../database');
const createJwt = require('../createjwt');
const { v4: uuidv4 } = require('uuid');

routes.get('/', async (req, res) => {
    res.render('login', {invalidCredentials: false});
});

routes.post('/', async (req, res) => {
    const {username, password} = req.body;
    const deviceID = req.cookies.deviceID;
    

    let email = username;

    const hashedPassword = await extractUserPassword(username, email);
    if(hashedPassword === "error") {
        res.render('login', {invalidCredentials: true});
        return;
    }

    let match = await comparePasswords(password, hashedPassword[0].password);
    let userId = hashedPassword[0].userId;
    if(match) {
        const token = createJwt(userId, username, email);
        res.cookie('jwt', token, {httpOnly: true, secure: true});
/*
        if(!deviceID){
            deviceID = uuidv4();
        }
            const expiryDate = new Date(2037, 0, 1);
            res.cookie('deviceID', deviceID, {httpOnly:true, secure:true, expires: expiryDate});
            await addDevice(userId, deviceID, req.useragent);
*/
        res.redirect('/home');
    }
    else {
        res.render('login', {invalidCredentials: true});
    }

});
module.exports = routes;