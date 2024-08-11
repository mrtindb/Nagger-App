'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');

require('express-async-errors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const home = require('./routes/home');
const devices = require('./routes/devices');
const register = require('./routes/register');
const login = require('./routes/login');
const logout = require('./routes/logout');
const account = require('./routes/account');
const webpush = require('web-push');
const useragent = require('express-useragent');
const passreset = require('./routes/passreset');
const app = express();
const { extractData, updateNextExecutionTime } = require('./database');

webpush.setVapidDetails(
    `mailto:${process.env.EMAIL}`,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);
//Static files 
app.use('/static',express.static(path.join(__dirname, 'resources')));


//Removing trailing slashes

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(useragent.express());

app.use('/', home);
app.use('', home);

app.use((req, res, next) =>     
    {   
        if(req.url==='' || req.url==='/') next();
        let site = req.url;
        let newurl = site.replace(/\/$/, "");
        if (site != newurl) {
            res.redirect(newurl);
        } else {
            next();
        }
    }); 

app.use('/home', home);
app.use('/devices', devices);
app.use('/register', register);
app.use('/login', login);
app.use('/logout', logout);
app.use('/passreset', passreset);
//app.use('/account', account);
app.get('/about', (req, res) => { res.render('about') });
app.use('/setup', require('./routes/setup'));
const database = require('./database');
app.use('/account', account);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.status(404);
  
    // respond with html page
    if (req.accepts('html')) {
      res.render('404');
      return;
    }
  
    // respond with json
    if (req.accepts('json')) {
      res.json({ error: 'Not found' });
      return;
    }
  
    // default to plain-text. send()
    res.type('txt').send('Not found');
  });

database.connectToDatabase();

//This method gets called every 10 seconds and looks for Naggers that are due to be sent as a notification
setInterval(async () => {

    let updatePromises = new Array();
    extractData().then(async result => {

        // Loop through all users
        result.forEach(user => {
            let userId = user.userId;
            let naggers = JSON.parse(user.user_data) || [];
            let devices = JSON.parse(user.devices) || [];

            // Loop through all naggers
            let date = new Date();
            naggers.forEach(nagger => {
                const nextExecution = new Date(nagger.nextExecution);

                if (nextExecution.getTime() < date.getTime()) {
                    updatePromises.push(() => updateNextExecutionTime(userId, nagger.naggerId));

                    const payload = {
                        title: nagger.title,
                        body: nagger.description,
                        details: {
                            test: 'test'
                        }
                    }

                    devices.forEach(device => {
                        if (device.enabled) {
                            webpush.sendNotification(device.s, JSON.stringify(payload)).catch(err => {
                            });
                        }
                    });
                }
            });
        });
        await Promise.all(updatePromises.map(fn => fn()));
    });

}, 20000)

module.exports = app;