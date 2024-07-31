
'use strict';

const express = require('express');
const routes = express.Router();
const webpush = require('web-push');
const jwtMiddleware = require('../jwtMiddleware');
const { getUserNaggers, addNagger, deleteNagger, alterNagger, addDevice } = require('../database');
const { escapeUserInput } = require('../escaping');
const useragent = require('express-useragent');

routes.get('/', jwtMiddleware, async (req, res) => {

    const userData = req.user;
    const naggers = await getUserNaggers(userData.userId);
    if (naggers.length === 0) {
        res.render('home', { naggers: false });
    }
    else {
        res.render('home', { naggers });
    }
});

routes.put('/addNagger', jwtMiddleware, async (req, res) => {
    if (!req.body) {
        res.status(400).send('Bad Request');
        return;
    }

    let naggerTitle = req.body.title || 'Untitled';
    let naggerDescription = req.body.description || 'No description';
    let naggerSeverity = req.body.severity || 1;
    let naggerDate = req.body.naggerDate || new Date();

    let nagger = {
        title: escapeUserInput(naggerTitle),
        description: escapeUserInput(naggerDescription),
        severity: naggerSeverity,
        naggerDate: naggerDate
    };


    let newNaggerId = await addNagger(req.user.userId, nagger);
    res.json({ newNaggerId });

});

routes.delete('/deleteNagger/:id', jwtMiddleware, async (req, res) => {
    if (!req.params.id) {
        res.status(400).send('Bad Request');
        return;
    }
    let naggerId = req.params.id;

    let userId = req.user.userId;

    let result = await deleteNagger(userId, naggerId);
    if (result == "ok") {
        res.sendStatus(204);
    }
});

routes.post('/alterNagger/:id', jwtMiddleware, async (req, res) => {
    if (!req.params.id) {
        res.status(400).send('Bad Request');
        return;
    }
    let naggerId = req.params.id;
    let userId = req.user.userId;
    let nagger = req.body;

    let naggerTitle = nagger.title || 'Untitled';
    let naggerDescription = nagger.description || 'No description';
    let naggerSeverity = nagger.severity || 1;

    let newNagger =
    {
        title: escapeUserInput(naggerTitle),
        description: escapeUserInput(naggerDescription),
        severity: naggerSeverity
    }

    let result = await alterNagger(userId, naggerId, newNagger);

    if (result) {
        res.sendStatus(204);
        return;
    }
    else {
        res.status(400).send('Bad Request');
    }
});

var s;
routes.post('/subscribe', jwtMiddleware,  async (req, res) => {

    s = req.body;
    //console.log(s);
    let deviceID = req.cookies.deviceID;
    if (!deviceID) {

        deviceID = uuidv4();
    }

    const expiryDate = new Date(2037, 0, 1);
    await addDevice(req.user.userId, deviceID, req.useragent, s);
    res.cookie('deviceID', deviceID, { httpOnly: true, secure: true, expires: expiryDate });


    res.status(201).json({});
    return;
});

routes.post('/sendNotification', jwtMiddleware , (req, res) => {
    const userAgent = req.useragent;
    const notificationPayload = {
        title: userAgent.browser + ' ' + userAgent.platform,
        body: 'This is the body of the notification',
        url: 'https://google.com',
    };


    webpush.sendNotification(s, JSON.stringify(notificationPayload));
    res.status(201).json({});

});


module.exports = routes;