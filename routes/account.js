
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { cookie } = require('express-validator');
const { comparePasswords, hashPassword } = require('../passwordhashing');
const { getAccountDetails, extractUserPassword, changePassword, accountEditDate } = require('../database');

routes.get('/', cookie('jwt').notEmpty().bail().isString().escape(), jwtMiddleware, async (req, res) => {
    let userId = req.user.userId;
    let accountDetails = await getAccountDetails(userId);
    let creationDate = accountDetails.acc_created_on;
    let editDate = accountDetails.acc_edited_on || 'never';
    let naggerCount = accountDetails.nagger_last_id+1;
    creationDate = creationDate.toISOString().split('T')[0].split('-').reverse().join('/');
    editDate = editDate.toISOString().split('T')[0].split('-').reverse().join('/');
    res.render('account', { creationDate, editDate, naggerCount });
});
routes.post('/', cookie('jwt').notEmpty().bail().isString().escape(), jwtMiddleware, async (req, res) => {
    //Comes from jwtMiddleware
    const user = req.user;
    const body = req.body;
    const oldPassword = body.oldPassword;
    const newPassword = body.newPassword;

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