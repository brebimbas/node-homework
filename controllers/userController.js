const {userSchema} = require('../validation/userSchema.js');
const crypto = require('crypto');
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);


async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");

    const derivedKey = await scrypt(password, salt, 64);

    return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
    const [salt, originalHash] = storedHash.split(":");

    const derivedKey = await scrypt(inputPassword, salt, 64);

    return crypto.timingSafeEqual(
        Buffer.from(originalHash, "hex"),
        derivedKey
    );
}


async function register(req, res) {
    if (!req.body) req.body = {};

    const {error, value} = userSchema.validate(req.body, {
        abortEarly: false
    });

    if (error) return res.status(400).json({
        message: error.details.map((detail) => detail.message),
    });

    const {name, email, password} = value;

    const hashedPassword = await hashPassword(password);


    const newUser = {
        id: global.users.length + 1,
        name,
        email,
        hashedPassword,
    };

    global.users.push(newUser);

    global.user_id = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
    };

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
    });

}


async function logon(req, res) {
    const {email, password} = req.body || {};

    const user = global.users.find(
        (user) => user.email === email
    );

    const goodCredentials =
        user && await comparePassword(password, user.hashedPassword);

    if (!goodCredentials) {
        return res.status(401).json({
            message: "Email or Password does not match",
        });
    }

    global.user_id = {
        id: user.id,
        name: user.name,
        email: user.email,
    };

    return res.status(200).json({
        name: user.name,
        email: user.email,
    });
}


function logoff(req, res) {
    global.user_id = null;
    res.status(200).json({
        message: "User successfully signed off",
    });
}

module.exports = {
    register,
    logon,
    logoff,
};
