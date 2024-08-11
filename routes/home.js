
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { getUserNaggers, addNagger, deleteNagger, alterNagger, addDevice, extractDevices } = require('../database');
const { escapeUserInput } = require('../escaping');
const { v4: uuidv4 } = require('uuid');
const { cookie, body, validationResult, matchedData } = require('express-validator');

//Validation done
routes.get('/',
    cookie('jwt').notEmpty().bail().isString().escape(),
    jwtMiddleware,
    cookie('set').isString().custom(v => { if (v !== 'true' && v !== 'false') throw new Error('wrong format') }),
    cookie('deviceID').isString().isUUID(),
    async (req, res) => {

        const userData = req.user; //Coming from jwtMiddleware

        const naggers = await getUserNaggers(userData.userId);
        let deviceID = req.cookies.deviceID || "";
        let devices = JSON.parse(await extractDevices(userData.userId)) || [];
        let x = devices.filter(device => device.deviceId === deviceID);
        let set = true;
        if (x.length === 0) {

            set = false;
        }
        //console.log(naggers);
        if (naggers.length === 0) {
            res.render('home', { naggers: false, set });
        }
        else {
            res.render('home', { naggers, set });
        }
    });

//Validation done
routes.post('/addNagger',

    cookie('jwt').notEmpty().bail().isString().escape(),
    jwtMiddleware,

    body('title').isString().isLength({ min: 0, max: 15 }).escape(),
    body('description').isString().isLength({ min: 0, max: 90 }).escape(),
    body('severity').isInt().isIn([0, 1, 2, 3, 4, 5]),
    body('naggerDate').matches(/^([1-9]|([012][0-9])|(3[01]))\-([0]{0,1}[1-9]|1[012])\-\d\d\d\d\s([0-1]?[0-9]|2?[0-3]):([0-5]\d)$/),

    async (req, res) => {
        if (typeof req.body !== 'object') {
            res.status(400).send('Bad Request');
            return;
        }

        if (!validationResult(req).isEmpty()) {
            console.log(validationResult(req));
            res.status(400).send('Bad Request');
            return;
        }

        let naggerTitle = matchedData(req).title || 'Untitled';
        let naggerDescription = matchedData(req).description || 'No description';
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

routes.delete('/deleteNagger/:id',

    cookie('jwt').notEmpty().bail().isString().escape(), jwtMiddleware,

    async (req, res) => {
        if (!req.params.id) {
            res.status(400).send('Bad Request');
            return;
        }
        let naggerId = req.params.id;

        let userId = req.user.userId;

        let result = await deleteNagger(userId, naggerId);
        console.log('home');
        if (result === "ok") {
            res.sendStatus(204);
        }
        else res.sendStatus(400);
    });

routes.put('/alterNagger/:id', cookie('jwt').notEmpty().bail().isString().escape(), jwtMiddleware, async (req, res) => {
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

    if (result === 'ok') {
        res.sendStatus(204);
    }
    else {
        res.status(400);
    }
});

routes.put('/subscribe', cookie('jwt').notEmpty().bail().isString().escape(), jwtMiddleware, async (req, res) => {
    let s = req.body;
    let deviceID = req.cookies.deviceID;
    if (!deviceID) {

        deviceID = uuidv4();
    }
    const expiryDate = new Date(2037, 0, 1);
    addDevice(req.user.userId, deviceID, req.useragent, s);
    res.cookie('deviceID', deviceID, { httpOnly: true, secure: true, expires: expiryDate });
    res.cookie('set', true, { secure: true, expires: expiryDate });
    res.status(201).json({ status: 'ok' });
    return;
});


module.exports = routes;