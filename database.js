'use strict';

const mysql = require('mysql2');
const nextExecution = require('./scheduler');
const { validate } = require('uuid');
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
        con.query(`SELECT userId FROM users WHERE username = ?`, [username], function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
    return await promise;
}

async function extractUserPassword(username, email) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT password, userId FROM users WHERE username = ? OR email = ?`, [username, email], function (err, result) {
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
        con.query(`SELECT username, email FROM users WHERE username = ?`, [username], function (err, result) {
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

        con.query(`SELECT username, email FROM users WHERE email = ?`, [email], function (err, result) {
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
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
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
        con.query(`SELECT user_data,nagger_last_id FROM users WHERE userId = ?`, [userId], function (err, result) {

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
                [JSON.stringify(naggerCollection), newNagger.naggerId, userId], function (err, result) {
                    if (err) throw err;
                    resolve(newId);
                });
        });
    });
    return await promise;
}

async function deleteNagger(userId, naggerId) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            let naggerCollection = JSON.parse(result[0].user_data);
            let newNaggerCollection = naggerCollection.filter(nagger => nagger.naggerId != naggerId);
            con.query(`UPDATE users SET user_data = ? WHERE userId = ?`,
                [JSON.stringify(newNaggerCollection), userId], function (err, result) {
                    if (err) throw err;
                    console.log('resolve');
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
            let arrayIndex = naggerCollection.findIndex(a => a.naggerId == naggerId);
            naggerCollection[arrayIndex].title = newNagger.title;
            naggerCollection[arrayIndex].description = newNagger.description;
            naggerCollection[arrayIndex].severity = newNagger.severity;
            naggerCollection[arrayIndex].nextExecution = nextExecution(newNagger.severity);
            con.query(`UPDATE users SET user_data = ? WHERE userId = ?`,
                [JSON.stringify(naggerCollection), userId], function (err, result) {
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
                [JSON.stringify(naggerCollection), userId], function (err, result) {
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
            if (devices.length > 0 && devices.filter(device => device.deviceId == deviceId).length > 0) {
                resolve('ok');
                return;
            }
            devices.push(newDevice);
            con.query(`UPDATE users SET devices = ? WHERE userId = ?`,
                [JSON.stringify(devices), userId], function (err, result) {
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

async function changeDeviceState(userId, deviceId, state) {
    let promise = new Promise(async (resolve, reject) => {
        let devices = JSON.parse(await extractDevices(userId));
        let targetDeviceIndex = devices.findIndex(x => x.deviceId === deviceId);
        devices[targetDeviceIndex].enabled = state;
        con.query(`UPDATE users SET devices = ? WHERE userId = ?`, [JSON.stringify(devices), userId], (err, result) => {
            if (err) throw err;
            resolve('ok');
        })

    }
    )
    return await promise;
}

async function storeURLToken(email, token) {
    let date = new Date(Date.now());
    date.setMinutes = date.getMinutes + 15;
    let promise = new Promise(async (resolve, reject) => {
        con.query('SELECT * FROM reset_tokens WHERE email=?', [email], (err, result) => {
            if (result.length !== 0) {
                con.query('UPDATE reset_tokens SET token=?,valid=? WHERE email=?', [token, JSON.stringify({validUntil:date}), email], (err, result) => {
                    if (err) throw err;
                    resolve('ok');
                })
            }
            else {
                con.query('INSERT INTO reset_tokens VALUES (?,?,?)', [email, token, JSON.stringify({validUntil:date})], (err, result) => {
                    if (err) throw err;
                    resolve('ok');
                })
            }
        })


    })
}

async function existsToken(token){
    let promise = new Promise((resolve,reject)=>{
        con.query("SELECT email,valid FROM reset_tokens WHERE token = ?", [token], (err,result) => {
            console.log("result: "  + result);
            
            if(err) throw err;
            if(result.length==0) {
                resolve (false);
                return;
            }
            console.log("result[0]: "  + result[0]);
            let date = new Date(Date.now());
            if(JSON.parse(result[0].valid).validUntil<date) {
                resolve(false);
            }
            else resolve(result[0].email);
        })
    })
    return await promise;
}

async function changePassword(email,password){
    let promise = new Promise((resolve,reject) => {
        con.query("UPDATE users SET password = ? WHERE email = ?", [password,email], (err,result)=>{
            if(err) throw err;
            resolve('ok');
        })
    })
    return await promise;
}
module.exports = { changePassword,existsToken,storeURLToken, changeDeviceState, extractDevices, updateNextExecutionTime, extractData, addDevice, alterNagger, deleteNagger, addNagger, connectToDatabase, addUserToDatabase, extractUserPassword, checkEmailAvailability, checkUsernameAvailability, getUserNaggers };