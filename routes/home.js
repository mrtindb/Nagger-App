
'use strict';

const express = require('express');
const routes = express.Router();
const jwtMiddleware = require('../jwtMiddleware');
const { getUserNaggers, addNagger, deleteNagger, alterNagger } = require('../database');

routes.get('/', jwtMiddleware, async (req, res) => {

    const userData = req.user;
    const naggers = await getUserNaggers(userData.userId);
    if (naggers.length === 0) {
        res.render('home', { naggers: false });
    }
    else {
        console.log(naggers);
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
        title: naggerTitle,
        description: naggerDescription,
        severity: naggerSeverity,
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
        title: naggerTitle,
        description: naggerDescription,
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

module.exports = routes;