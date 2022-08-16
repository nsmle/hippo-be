const { Router } = require('express');
const { body, query } = require('express-validator');
const requestValidator = require('./../app/http/middleware/requestValidator.js')
// import sessionValidator from './../app/http/middleware/sessionValidator.js'
const {
    getProfile
} = require('./../app/http/controllers/userController.js');

const router = Router()

router.get('/me',
    query('apikey').notEmpty(),
    requestValidator,
    // sessionValidator,
    getProfile
)

module.exports = router;
