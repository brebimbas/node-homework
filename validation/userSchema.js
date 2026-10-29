const Joi = require('joi');

const userSchema = Joi.object({
        name: Joi.string().trim().required(),
        email: Joi.string().lowercase().email().required(),
        password: Joi.string().trim().min(3).max(30).required(),
    }
);

module.exports = {userSchema};