const {userSchema} = require('../validation/userSchema.js');
const crypto = require('crypto');
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

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

async function register(req, res, next) {
    if (!req.body) req.body = {};

    const {error, value} = userSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        return res.status(400).json({
            message: "Validation failed",
            details: error.details,
        });
    }

    let result = null;
    value.hashed_password = await hashPassword(value.password);
    // the code to here is like the in-memory version
    try {
        result = await pool.query(
            `INSERT INTO users (email, name, hashed_password)
             VALUES ($1, $2, $3) RETURNING id, email, name`,
            [value.email, value.name, value.hashed_password],
        ); // note that you use a parameterized query
    } catch (e) {
        // the email might already be registered
        if (e.code === "23505") {
            return res.status(400).json({
                message: "Email is already registered",
            });
        }

        return next(e); // all other errors get passed to the error handler
    }

    const user = result.rows[0];

    global.user_id = user.id;

    return res.status(201).json({
        name: user.name,
        email: user.email,
    });
}

async function logon(req, res) {
    const {email, password} = req.body || {};

    const normalizedEmail = email?.toLowerCase();

    const user = await prisma.user.findUnique({
        where: {email: normalizedEmail},
    });
    
    if (!user) {
        return res.status(401).json({
            message: "Email or Password does not match",
        });
    }

    const goodCredentials = await comparePassword(
        password,
        user.hashedPassword
    );

    if (!goodCredentials) {
        return res.status(401).json({
            message: "Email or Password does not match",
        });
    }

    global.user_id = user.id;

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
