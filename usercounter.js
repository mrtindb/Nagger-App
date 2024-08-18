'use strict';
require('dotenv').config();
const mysql = require('mysql2');
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});
con.connect(function (err) {
    if (err) throw err;
})
con.query("USE dbnagger", function (err, result) {
    if (err) throw err;
    con.query("SELECT COUNT(*) FROM users", function (err, result) {
        if (err) throw err;
        console.log(result);
        con.end();
    });
})

