
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { comparePasswords, hashPassword } = require('../passwordhashing');
const { getAccountDetails, extractUserPassword, changePassword, accountEditDate } = require('../database');
const { cookie, body, validationResult, matchedData } = require('express-validator');

//Validated
routes.get('/', cookie('jwt').notEmpty().bail().isString(), jwtMiddleware, async (req, res) => {
    //Comes from jwtMiddleware
    let userId = matchedData(user).userId;
    let accountDetails = await getAccountDetails(userId);
    let creationDate = accountDetails.acc_created_on;
    let editDate = accountDetails.acc_edited_on || 'never';
    let naggerCount = accountDetails.nagger_last_id+1;
    creationDate = creationDate.toISOString().split('T')[0].split('-').reverse().join('/');
    editDate = editDate.toISOString().split('T')[0].split('-').reverse().join('/') || 'never';
    res.render('account', { creationDate, editDate, naggerCount });
});

//Validated
routes.post('/', 
    //Validation logic
    cookie('jwt').notEmpty().bail().isString(),
    body('oldPassword').isString().isLength({ min: 8, max: 49 }),
    body('newPassword').isString().isLength({ min: 8, max: 49 }),

    jwtMiddleware, async (req, res) => {
    //Comes from jwtMiddleware
    const user = matchedData(user);

    if(validationResult(req).isEmpty() === false) {
        res.status(400).send('Bad Request');
        return;
    }
    const { oldPassword, newPassword } = matchedData(req);

    const userData = await extractUserPassword(user.username, user.email);
    const match = await comparePasswords(oldPassword, userData[0].password);

    if (!match) {
        res.status(400).send('Incorrect old password');
        return;
    }

    if (oldPassword === newPassword) {
        res.status(400).send('New password cannot be the same as old password');
        return;
    }

    const hashedPassword = await hashPassword(newPassword);
    let result = await changePassword(user.email, hashedPassword);
    if (result === 'ok') {
        accountEditDate(user.email);
        res.status(204).send('Password changed successfully');
    }
    else {
        res.status(500).send('Error changing password');
    }
});
module.exports = routes;