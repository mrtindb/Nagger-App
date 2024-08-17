'use strict';

const mysql = require('mysql2');
const nextExecution = require('./scheduler');
const { validate } = require('uuid');
var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

/** Connects the application to database (executed once) */
function connectToDatabase() {
    con.connect(function (err) {
        if (err) throw err;
    })
    con.query("USE dbnagger", function (err, result) {
        if (err) throw err;
    })
}

/** Adds new user to database @param {string} password - the hashed password */
async function addUserToDatabase(username, email, password) {

    var t = new Date(Date.now());
    let formattedDate = t.toISOString().split('T')[0];

    let toInsert = [username, email, password, formattedDate, JSON.stringify([]), 0];

    const queryString = "INSERT INTO `users` (`username`, `email`, `password`, `acc_created_on`, `user_data`, `nagger_last_id`) VALUES (?,?,?,?,?,?)";


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

/** Returns the hashed password and the userId */
async function extractUserPassword(email) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT password, userId, username FROM users WHERE email = ?`, [email], function (err, result) {
            if (err) throw err;
            if (result.length === 0) {
                resolve("error");
            }
            else resolve(result);
        });

    });
    return await promise;
}

/** Checks if the username is available @returns true if there is no such username in the DB, false otherwise */
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

/** Checks if the email is available @returns true if there is no such email in the DB, false otherwise */
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

/** Returns the naggers of the user */
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

/** Deletes a nagger */
async function deleteNagger(userId, naggerId) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            if(result.length === 0) { resolve('ok'); return; }
            let naggerCollection = JSON.parse(result[0].user_data);
            let newNaggerCollection = naggerCollection.filter(nagger => nagger.naggerId != naggerId);
            con.query(`UPDATE users SET user_data = ? WHERE userId = ?`,
                [JSON.stringify(newNaggerCollection), userId], function (err, result) {
                    if (err) throw err;
                    resolve('ok');
                });
        });
    });
    return await promise;
}

/** Alters a nagger based on userId and naggerId, the newNagger param must be provided
 *  as JSON and have at least the fields: @field title @field description @field severity @field nextExecution */
async function alterNagger(userId, naggerId, newNagger) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            if(result.length === 0) { resolve('ok'); return; }
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

/** Updates the next execution time of a nagger, must be called on every notification trigger */
function updateNextExecutionTime(userId, naggerId) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT user_data FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            if(result.length === 0) { resolve('ok'); return; }
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

/** Adds a new device to the user @param {JSON} s JSON object returned from the Push API that comes from the client upon subscription
 * @param {JSON} deviceInfo JSON object that contains user agent information
 */
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

            // Check if device already exists
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

/** Extracts the userId, devices and user data  */
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
            if(result.length === 0) resolve('[]');
            else resolve(result[0].devices);
        });
    });
    return await promise;
}

/** Changes the device state @param {boolean} state is the new state of the device, where true is enabled and false - disabled  */
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

/** Stores a new URL Token in the DB associated with a user email, that has a limited lifespan and is to be used for password reseting */
async function storeURLToken(email, token) {
    let date = new Date(Date.now());
    date.setMinutes = date.getMinutes + 15;
    let promise = new Promise(async (resolve, reject) => {
        con.query('SELECT * FROM reset_tokens WHERE email=?', [email], (err, result) => {
            if (result.length !== 0) {
                con.query('UPDATE reset_tokens SET token=?,valid=? WHERE email=?', [token, JSON.stringify({ validUntil: date }), email], (err, result) => {
                    if (err) throw err;
                    resolve('ok');
                })
            }
            else {
                con.query('INSERT INTO reset_tokens VALUES (?,?,?)', [email, token, JSON.stringify({ validUntil: date })], (err, result) => {
                    if (err) throw err;
                    resolve('ok');
                })
            }
        })


    })
}

/** Checks if a token exists and is valid, returns the email associated with the token, false otherwise */
async function existsToken(token) {
    let promise = new Promise((resolve, reject) => {
        con.query("SELECT email,valid FROM reset_tokens WHERE token = ?", [token], (err, result) => {
            if (err) throw err;
            if (result.length == 0) {
                resolve(false);
                return;
            }
            let date = new Date(Date.now());
            if (JSON.parse(result[0].valid).validUntil < date) {
                resolve(false);
            }
            else resolve(result[0].email);
        })
    })
    return await promise;
}

/** Changes the password of a user */
async function changePassword(email, password) {
    let promise = new Promise((resolve, reject) => {  
        con.query("UPDATE users SET password = ? WHERE email = ?", [password, email], (err, result) => {
            if (err) throw err;
            resolve('ok');
        })
    })
    return await promise;
}

/** Invalidates a URL token, deleting the record from the table entirely */
async function invalidateURLToken(email) {
    let promise = new Promise((resolve, reject) => {
        con.query("DELETE FROM reset_tokens WHERE email = ?", [email], (err, result) => {
            if (err) throw err;
            resolve('ok');
        })
    });
    return await promise;
}

/** Returns account creation date, account edit date and last nagger id. This is all the information for backend rendering of the account page */
async function getAccountDetails(userId) {
    let promise = new Promise((resolve, reject) => {
        con.query(`SELECT acc_created_on, acc_edited_on, nagger_last_id FROM users WHERE userId = ?`, [userId], function (err, result) {
            if (err) throw err;
            if(result.length === 0) resolve({acc_created_on: undefined, acc_edited_on: undefined, nagger_last_id: 0});
            else resolve(result[0]);
        });
    });
    return await promise;
}

/** Updates account edit date to the current date. Designed to be called immediately after an account edit */
async function accountEditDate(email) {
    let promise = new Promise((resolve, reject) => {
        let t = new Date(Date.now());
        let formattedDate = t.toISOString().split('T')[0];
        con.query("UPDATE users SET acc_edited_on = ? WHERE email = ?", [formattedDate, email], (err, result) => {
            if (err) throw err;
            resolve('ok');
        })
    })
    return await promise;
}

module.exports = {
    accountEditDate,
    getAccountDetails,
    invalidateURLToken,
    changePassword,
    existsToken,
    storeURLToken,
    changeDeviceState,
    extractDevices,
    updateNextExecutionTime,
    extractData,
    addDevice,
    alterNagger,
    deleteNagger,
    addNagger,
    connectToDatabase,
    addUserToDatabase,
    extractUserPassword,
    checkEmailAvailability,
    checkUsernameAvailability,
    getUserNaggers
};