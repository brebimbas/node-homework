const {userSchema} = require('../validation/userSchema.js');
const crypto = require('crypto');
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
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

    value.hashedPassword = await hashPassword(value.password);
    delete value.password;

    let user = null;
    try {
        user = await prisma.user.create({
            data: {
                name: value.name,
                email: value.email,
                hashedPassword: value.hashedPassword
            },
            select: {name: true, email: true, id: true} // specify the column values to return
        });
    } catch (err) {
        if (err.name === "PrismaClientKnownRequestError" &&
            err.code === "P2002") {
            return res.status(400).json({
                message: "Email is already registered",
            });
        } else {
            return next(err); // the error handler takes care of other errors
        }
    }

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

async function show(req, res) {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({error: "Invalid user ID"});
    }

    if (userId !== global.user_id) {
        return res.status(403).json({error: "Forbidden"});
    }

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            Task: {
                where: {isCompleted: false},
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    createdAt: true
                },
                orderBy: {createdAt: 'desc'},
                take: 5
            }
        }
    });

    if (!user) {
        return res.status(404).json({message: "User not found"});
    }

    res.status(200).json(user);
}

module.exports = {
    register,
    logon,
    logoff,
    show,
};
