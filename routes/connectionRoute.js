const { Router } = require('express');
const { body, query } = require('express-validator');
const requestValidator = require('./../app/http/middleware/requestValidator.js');
const apikeyValidator = require('./../app/http/middleware/apikeyValidator.js');
const { connectionConnect, connectionStatus, connectionDisconnect } = require('./../app/http/controllers/connectionController.js');

const router = Router()

// Connect to whatsappp
router.get('/connect',
    query('apikey')
        .notEmpty()
        .withMessage('apikey required')
        .isLength({ min: 30, max: 64 })
        .withMessage('apikey must be more than 30 and less than 64 characters'),
    query('isLegacy'),
    requestValidator,
    apikeyValidator,
    connectionConnect
)

// Get whatsapp connection status
router.get('/status',
    query('apikey')
        .notEmpty()
        .withMessage('apikey required')
        .isLength({ min: 30, max: 64 })
        .withMessage('apikey must be more than 30 and less than 64 characters'),
    requestValidator,
    apikeyValidator,
    connectionStatus
)

// Disconnect whatsapp connection
router.get('/disconnect',
    query('apikey')
        .notEmpty()
        .withMessage('apikey required')
        .isLength({ min: 30, max: 64 })
        .withMessage('apikey must be more than 30 and less than 64 characters'),
    requestValidator,
    apikeyValidator,
    connectionDisconnect
)

module.exports = router;
