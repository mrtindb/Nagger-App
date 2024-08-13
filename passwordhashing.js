const bcrypt = require('bcryptjs');

/** Hashes a password with a salt */
async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

/** Compares a password to a hashed password */
async function comparePasswords(password, hashedPassword) {
    let p =  await bcrypt.compare(password, hashedPassword);
    return p;
}

module.exports = {hashPassword, comparePasswords};