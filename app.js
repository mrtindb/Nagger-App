'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
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

//VAPID keys for notification services
webpush.setVapidDetails(
    `mailto:${process.env.EMAIL}`,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

//Static files 
app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'sw', 'service-worker.js'));
});
app.get('/register-sw.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'sw', 'register-sw.js'));
});
app.use('/static',express.static(path.join(__dirname, 'resources')));



// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(useragent.express());

app.use('/', home);
app.use('', home);

//Removing trailing slashes
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
app.use('/passreset/static', express.static(path.join(__dirname, 'resources')));
app.get('/about', (req, res) => { res.render('about') });
app.use('/setup', require('./routes/setup'));
app.use('/account', account);
const database = require('./database');

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
            let date = new Date();
            // Loop through all naggers
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
                    // Loop through all devices and sends a notification to each enabled device
                    devices.forEach(device => {
                        if (device.enabled) {
                            webpush.sendNotification(device.s, JSON.stringify(payload)).catch(err => {
                            });
                        }
                    });
                }
            });
        });
        //Update the next date and time for a notification to be sent for all naggers that are due on the current function call
        await Promise.all(updatePromises.map(fn => fn()));
    });

}, 20000)

module.exports = app;