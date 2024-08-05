const jwt = require('jsonwebtoken');
require('dotenv').config();
const { matchedData, validationResult } = require('express-validator');

function jwtMiddleware(req, res, next) {
    const result = validationResult(req);

    if(!result.isEmpty()) {
        return res.redirect('/login');
    }

    const token = matchedData(req).jwt;

    if(!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err) {
        return res.redirect('/login');
    }
};

module.exports = jwtMiddleware;