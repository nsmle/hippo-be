const { validationResult } = require('express-validator');
const response = require('./../response.js');

const validate = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return response(res, 400, false, 'Please fill out all required input.', errors)
    }

    next()
}

module.exports = validate
