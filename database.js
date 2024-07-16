const mysql = require('mysql2');

var con = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

function connectToDatabase() {
con.connect(function(err) {
    if(err) throw err;
})
}

async function addUserToDatabase(username, email, password) {

    var t = new Date(Date.now());
    let formattedDate = t.toISOString().split('T')[0];

    let toInsert = [[username, email, password, formattedDate]];

    const queryString = "INSERT INTO `users` (`username`, `email`, `password`, `acc_created_on`) VALUES (?)";


let promise = new Promise((resolve, reject) => {
    con.query("USE nagger", function(err, result) {
        if(err) throw err;
    });
    con.query(queryString, toInsert , function(err, result) {
        if(err) throw err;
    });
    con.query(`SELECT userId FROM users WHERE username = '${username}'`, function(err, result) {
    if(err) throw err;
    resolve(result);
    });
});
    return await promise;
}

async function extractUserPassword(username, email) {

    let promise = new Promise((resolve, reject) => {

    con.query("USE nagger", function(err, result) {
        if(err) throw err;
    });

    con.query(`SELECT password, userId FROM users WHERE username = '${username}' OR email = '${email}'`, function(err, result) {
        if(err) throw err;
        if(result.length === 0) {
            resolve("error");
        }
        else resolve(result);
    });

    });
    return await promise;
}

module.exports = {connectToDatabase, addUserToDatabase, extractUserPassword};