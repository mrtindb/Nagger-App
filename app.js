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
const app = express();
const { extractData, updateNextExecutionTime } = require('./database');
const nextExecution = require('./scheduler');

webpush.setVapidDetails(
    `mailto:${process.env.EMAIL}`,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'resources')));
app.use(useragent.express());
app.use('/', home);
app.use('/home', home);
app.use('/devices', devices);
app.use('/register', register);
app.use('/login', login);
app.use('/logout', logout);
app.use('/account', account);
app.get('/about', (req, res) => { res.render('about') });
app.use('/setup', require('./routes/setup'));
const database = require('./database');

database.connectToDatabase();


module.exports = app;

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
                        options : {
                            data: {
                                test: "kuche"
                            }
                        },
                        url: 'https://google.com'
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
    }

    );

}, 20000)