
'use strict';

const express = require('express');
const routes = express.Router();
const webpush = require('web-push');
const jwtMiddleware = require('../jwtMiddleware');
const { getUserNaggers, addNagger, deleteNagger, alterNagger } = require('../database');
const { escapeUserInput } = require('../escaping');
const { escape } = require('mysql2');
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
    if(!req.body) {
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
        severity:  naggerSeverity,
        naggerDate: naggerDate
    };
    
    
    let newNaggerId = await addNagger(req.user.userId, nagger);
    res.json({newNaggerId});

});

routes.delete('/deleteNagger/:id', jwtMiddleware, async (req, res) => {
    if(!req.params.id) {
        res.status(400).send('Bad Request');
        return;
    }
    let naggerId = req.params.id;

    let userId = req.user.userId;

    let result = await deleteNagger(userId, naggerId);
    if(result=="ok") {
        res.sendStatus(204);
    }
});

routes.post('/alterNagger/:id', jwtMiddleware, async (req, res) => {
    if(!req.params.id) {
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
        title: escapeUserInput( naggerTitle ),
        description: escapeUserInput(naggerDescription),
        severity: naggerSeverity
    }

    let result = await alterNagger(userId, naggerId, newNagger);

    if(result) {
        res.sendStatus(204);
        return;
    }
    else {
        res.status(400).send('Bad Request');
    }
});


let subscriptions = [];
routes.post('/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
  });

  routes.post('/sendNotification', (req, res) => {
    const notificationPayload = {
      title: 'New Notification',
      body: 'This is the body of the notification',
      url: 'https://google.com',
    };
  
    const promises = subscriptions.map(sub => {
      return webpush.sendNotification(sub, JSON.stringify(notificationPayload));
    });
  
    Promise.all(promises).then(() => res.sendStatus(200));
  });


module.exports = routes;