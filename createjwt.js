const jwt = require('jsonwebtoken');
require('dotenv').config();

function createJwt(userId, username, email) {
    const payload = {
        userId,
        username,
        email
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET,{algorithm: 'HS256', expiresIn: '24d'});
    return token;
}

module.exports = createJwt;