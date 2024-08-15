
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { getUserNaggers, addNagger, deleteNagger, alterNagger, addDevice, extractDevices } = require('../database');
const { v4: uuidv4 } = require('uuid');
const { cookie, body, validationResult, matchedData, param } = require('express-validator');

//Validated
routes.get('/',

    cookie('jwt').notEmpty().bail().isString(),
    jwtMiddleware,
    //cookie('set').isString().custom(v => { if (v !== 'true' && v !== 'false') throw new Error('wrong format') }),
    cookie('deviceID').isString().isUUID(),
    
    async (req, res) => {

        const userData = req.user; //Coming from jwtMiddleware
        console.log(userData);
        const naggers = await getUserNaggers(userData.userId);
        let deviceID = req.cookies.deviceID || "";
        let devices = JSON.parse(await extractDevices(userData.userId)) || [];
        let x = devices.filter(device => device.deviceId === deviceID);
        let set = true;
        if (x.length === 0) {

            set = false;
        }
        if (naggers.length === 0) {
            res.render('home', { naggers: false, set });
        }
        else {
            res.render('home', { naggers, set });
        }
    });

//Validated
routes.post('/addNagger',

    cookie('jwt').notEmpty().bail().isString(),
    body('title').isString().isLength({ min: 0, max: 15 }),
    body('description').isString().isLength({ min: 0, max: 90 }),
    body('severity').isInt().isIn([0, 1, 2, 3, 4, 5]),
    body('naggerDate').matches(/^([1-9]|([012][0-9])|(3[01]))\-([0]{0,1}[1-9]|1[012])\-\d\d\d\d\s([0-1]?[0-9]|2?[0-3]):([0-5]\d)$/),
    
    jwtMiddleware,
    async (req, res) => {
        if (typeof req.body !== 'object') {
            res.status(400).send('Bad Request');
            return;
        }

        if (!validationResult(req).isEmpty()) {
            res.status(400).send('Bad Request');
            return;
        }

        let naggerTitle = req.body.title || 'Untitled';
        let naggerDescription = req.body.description || 'No description';
        let naggerSeverity = req.body.severity || 1;
        let naggerDate = req.body.naggerDate || new Date();

        let nagger = {
            title: naggerTitle,
            description: naggerDescription,
            severity: naggerSeverity,
            naggerDate: naggerDate
        };

        let newNaggerId = await addNagger(req.user.userId, nagger);
        res.json({ newNaggerId });

    });

//Validated
routes.delete('/deleteNagger/:id',

    cookie('jwt').notEmpty().bail().isString(),
    param('id').isInt(),

    jwtMiddleware,
    async (req, res) => {
        if (!req.params.id || !validationResult(req).isEmpty()) {
            res.status(400).send('Bad Request');
            return;
        }
        let naggerId = req.params.id;
        let userId = req.user.userId;
        let result = await deleteNagger(userId, naggerId);
        if (result === "ok") {
            res.sendStatus(204);
        }
        else res.sendStatus(400);
    });

//Validated
routes.put('/alterNagger/:id', 
    
    cookie('jwt').notEmpty().bail().isString(), 
    param('id').isInt(),
    body('title').isString().isLength({ min: 0, max: 15 }),
    body('description').isString().isLength({ min: 0, max: 90 }),
    body('severity').isInt().isIn([0, 1, 2, 3, 4, 5]),
    jwtMiddleware, 
    async (req, res) => {
    if (!req.params.id || !validationResult(req).isEmpty()) {
        console.log(validationResult(req).array());
        res.status(400).send('Bad Request');
        return;
    }

    let naggerId = req.params.id;
    let userId = req.user.userId;

    let naggerTitle = req.body.title || 'Untitled';
    let naggerDescription = req.body.description || 'No description';
    let naggerSeverity = req.body.severity || 1;

    let newNagger =
    {
        title: naggerTitle,
        description: naggerDescription,
        severity: naggerSeverity
    }

    let result = await alterNagger(userId, naggerId, newNagger);

    if (result === 'ok') {
        res.sendStatus(204);
    }
    else {
        res.sendStatus(400);
    }
});

routes.put('/subscribe', 
    
    cookie('jwt').notEmpty().bail().isString(),
    body().isJSON(), 
    body('keys').isJSON(),
    body('keys.auth').isString(),
    body('keys.p256dh').isString(),
    body('endpoint').isString().isURL(),
    jwtMiddleware, 
    async (req, res) => {
    if(!validationResult(req).isEmpty()) {
        res.status(400).send('Bad Request');
        return;
    }
    //s is the subscription object containing the endpoint for notifications and other information
    let s = req.body;
    console.log(s);
    let deviceID = req.cookies.deviceID;
    if (!deviceID) {
        deviceID = uuidv4();
    }
    const expiryDate = new Date(2037, 0, 1);
    addDevice(req.user.userId, deviceID, req.useragent, s);
    res.cookie('deviceID', deviceID, { httpOnly: true, secure: true, expires: expiryDate });
    res.status(201).json({ status: 'ok' });
    return;
});


module.exports = routes;