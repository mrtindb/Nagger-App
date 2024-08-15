const jwt = require('jsonwebtoken');
require('dotenv').config();
const { matchedData, validationResult } = require('express-validator');

function jwtMiddleware(req, res, next) {
    const result = validationResult(req);
    //If there are errors in the validation result, redirect to login
    if(!result.isEmpty()) {
        return res.redirect('/logout');
    }
    
    const token = matchedData(req).jwt;

    if(!token) {
        return res.redirect('/logout');
    }

    // Token verification. If this fails, redirect to login, otherwise proceed to the next middleware
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err) {
        return res.redirect('/logout');
    }
};

module.exports = jwtMiddleware;