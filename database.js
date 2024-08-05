'use strict';

const mysql = require('mysql2');
const nextExecution = require('./scheduler');
var con = mysql.createConnection({
    host: process.env.DB_LOCALHOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

function connectToDatabase() {
    con.connect(function (err) {
        if (err) throw err;
    })
    con.query("USE nagger", function (err, result) {
        if (err) throw err;
    })
}

async function addUserToDatabase(username, email, password, notificationIdentifier) {

    var t = new Date(Date.now());
    let formattedDate = t.toISOString().split('T')[0];

    let toInsert = [username, email, password, formattedDate, JSON.stringify([]), 0, notificationIdentifier];

    const queryString = "INSERT INTO `users` (`username`, `email`, `password`, `acc_created_on`, `user_data`, `nagger_last_id`, `notification_identifier`) VALUES (?,?,?,?,?,?,?)";


    let promise = new Promise((resolve, reject) => {
        con.query(queryString, toInsert, function (err, result) {
            if (err) throw err;
        });
        con.query(`SELECT userId FROM users WHERE username = ?`, [username] ,function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
    return await promise;
}

async function extractUserPassword(username, email) {

    let promise = new Promise((resolve, reject) => {

        con.query(`SELECT password, userId FROM users WHERE username = ? OR email = ?`,[username,email] , function (err, result) {
            if (err) throw err;
            if (result.length === 0) {
                resolve("error");
            }
            else resolve(result);
        });

    });
    return await promise;
}

async function checkUsernameAvailability(username) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT username, email FROM users WHERE username = ?`,[username], function (err, result) {
            if (err) throw err;
            if (result.length === 0) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
    return await promise;
};

async function checkEmailAvailability(email) {
    let promise = new Promise((resolve, reject) => {

        con.query(`SELECT username, email FROM users WHERE email = ?`,[email], function (err, result) {
            if (err) throw err;
            if (result.length === 0) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        });
    });
    return await promise;
};

async function getUserNaggers(userId) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`,[userId], function (err, result) {
            if (err) throw err;
            if (result.length === 0) { resolve([]); return; }
            resolve(JSON.parse(result[0].user_data));
        });
    });
    return await promise;

}
/** adds a new nagger and returns the new assinged naggerId */
async function addNagger(userId, nagger) {
    let newNagger = nagger;
    let promise = new Promise((resolve, reject) => {

        let naggerCollection = [];

        con.query(`SELECT user_data,nagger_last_id FROM users WHERE userId = ?`,[userId] , function (err, result) {

            if (err) {
                throw err;
            }
            if (result.length === 0) {
                naggerCollection = [];
            }
            else {
                naggerCollection = JSON.parse(result[0].user_data);
            }
            let newId = result[0].nagger_last_id + 1;
            newNagger.naggerId = result[0].nagger_last_id + 1;
            newNagger.nextExecution = nextExecution(newNagger.severity);
            naggerCollection.push(newNagger);

            con.query(`UPDATE users SET user_data = ?, nagger_last_id = ? WHERE userId = ?`,
            [JSON.stringify(naggerCollection),newNagger.naggerId,userId] , function (err, result) {
                if (err) throw err;
                resolve(newId);
            });
        });
    });
    return await promise;

}

async function deleteNagger(userId, naggerId) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?` , [userId], function (err, result) {
            if (err) throw err;
            let naggerCollection = JSON.parse(result[0].user_data);

            let newNaggerCollection = naggerCollection.filter(nagger => nagger.naggerId != naggerId);

            con.query(`UPDATE users SET user_data = ? WHERE userId = ?`,
            
            [JSON.stringify(newNaggerCollection), userId ], function (err, result) {
                if (err) throw err;
                resolve('ok');
            });
        });
    });
    return await promise;
}

async function alterNagger(userId, naggerId, newNagger) {

    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            let naggerCollection = JSON.parse(result[0].user_data);

            let oldNagger = naggerCollection.filter(nagger => nagger.naggerId == naggerId)[0];
            naggerCollection = naggerCollection.filter(nagger => nagger.naggerId != naggerId);
            oldNagger.title = newNagger.title;
            oldNagger.description = newNagger.description;
            oldNagger.severity = newNagger.severity;
            oldNagger.nextExecution = nextExecution(newNagger.severity);
            naggerCollection.push(oldNagger);
            con.query(`UPDATE users SET user_data = ? WHERE userId = ?`,
            [JSON.stringify(naggerCollection),userId], function (err, result) {
                if (err) throw err;
                resolve('ok');
            });
        });
    });
    return await promise;
}

function updateNextExecutionTime(userId, naggerId) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            let naggerCollection = JSON.parse(result[0].user_data);
            let nagger = naggerCollection.filter(nagger => nagger.naggerId == naggerId)[0];
            nagger.nextExecution = nextExecution(nagger.severity);
            naggerCollection = naggerCollection.filter(nagger => nagger.naggerId != naggerId);
            naggerCollection.push(nagger);
            con.query(`UPDATE users SET user_data = ? WHERE userId = ?`, 
            [JSON.stringify(naggerCollection),userId], function (err, result) {
                if (err) throw err;
                resolve('ok');
            });
        });
    });
}

async function addDevice(userId, deviceId, deviceInfo, s) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT devices FROM users WHERE userId = ?`, [userId], function (err, result) {
            let devices = new Array();
            if (err) throw err;
            
            if (result[0].devices) devices = JSON.parse(result[0].devices);
            let newDevice = {
                enabled: true,
                deviceId,
                deviceInfo,
                s
            }
            if(devices.length>0 && devices.filter(device => device.deviceId == deviceId).length > 0) {
                resolve('ok');
                return;
            }
            devices.push(newDevice);

            con.query(`UPDATE users SET devices = ? WHERE userId = ?`,
            [JSON.stringify(devices),userId], function (err, result) {
                if (err) throw err;
                resolve('ok');
            });
        })
    })
    return await promise;
}

async function extractData() {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT userId, user_data, devices FROM users`, function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
    return await promise;
}

async function extractDevices(userId) {

    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT devices FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            resolve(result[0].devices);
        });
    });
    return await promise;
}

module.exports = { extractDevices,updateNextExecutionTime,extractData, addDevice, alterNagger, deleteNagger, addNagger, connectToDatabase, addUserToDatabase, extractUserPassword, checkEmailAvailability, checkUsernameAvailability, getUserNaggers };