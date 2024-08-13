var nodemailer = require('nodemailer');
require('dotenv').config();

// Email credentials
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

// Sends a password reset email
async function sendMail(email, token) {
    let mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Password reset",
        html: `<h1>Reset password</h1><p>A password reset request for your Nagger account was generated. If this was you, please click on the link below. Otherwise you can ignore this email. The link is valid for 15 minutes.</p><p><a href='https://${process.env.DOMAIN_LOCAL}/passreset/${token}'>Reset password</a></p>`
    }
    transporter.sendMail(mailOptions,(err,info)=>{
        if(err) console.log(err);
    });
}

module.exports = sendMail;