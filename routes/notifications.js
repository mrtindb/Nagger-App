
'use strict';

const express = require('express');
const routes = express.Router();

let subscriptions = [];

routes.post('/', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
});
