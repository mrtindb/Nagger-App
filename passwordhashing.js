const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

async function comparePasswords(password, hashedPassword) {
    let p =  await bcrypt.compare(password, hashedPassword);
    return p;
}

module.exports = {hashPassword, comparePasswords};