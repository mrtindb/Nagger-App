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

function addUserToDatabase(username, email, password) {
    con.query("USE nagger", function(err, result) {
        if(err) throw err;
    });

    var t = new Date(Date.now());
    let formattedDate = t.toISOString().split('T')[0];

    let toInsert = [[username, email, password, formattedDate]];

    const queryString = "INSERT INTO `users` (`username`, `email`, `password`, `acc_created_on`) VALUES (?)";
    con.query(queryString, toInsert , function(err, result) {
        if(err) throw err;
        console.log("1 record inserted");
    }
)
con.query(`SELECT userId FROM users WHERE username = '${username}'`, function(err, result) {
    if(err) throw err;
    return result;
})
}

module.exports = {connectToDatabase, addUserToDatabase};