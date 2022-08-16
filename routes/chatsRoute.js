const { Router } = require('express');
const { body, query } = require('express-validator');
const requestValidator = require('./../app/http/middleware/requestValidator.js');
const apikeyValidator = require('./../app/http/middleware/apikeyValidator.js');
const { sendMessage } = require('./../app/http/controllers/chatsController.js');

const router = Router()

// send message to whatsappp
router.post('/send/message',
    query('apikey')
        .notEmpty()
        .withMessage('apikey required')
        .isLength({ min: 30, max: 64 })
        .withMessage('apikey must be more than 30 and less than 64 characters'),
    body('receiver')
        .notEmpty()
        .withMessage('receiver required'),
    body('message')
        .notEmpty()
        .withMessage('message required'),
    requestValidator,
    apikeyValidator,
    sendMessage
)

module.exports = router;
