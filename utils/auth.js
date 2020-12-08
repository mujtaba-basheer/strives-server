const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// generate and return jwt token
const generateToken = (user) => {
    return jwt.sign({ user }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// compare given passowrd with hashed password stored in db
const comparePasswords = (pass, hashedPass) => {
    return bcrypt.compareSync(pass, hashedPass);
};

// generate salt and hash password, and return it
const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

// verify given jwt
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, comparePasswords, hashPassword, verifyToken };
