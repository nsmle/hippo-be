const { Router } = require('express');
const { body, query } = require('express-validator');
const requestValidator = require('./../app/http/middleware/requestValidator.js');
const { login, register, changePassword, generateApiKey, refreshApiKey } = require('./../app/http/controllers/authController.js');

const router = Router()

// Login
router.post('/login',
    body('username')
        .notEmpty()
        .withMessage('username required')
        .isLength({ min: 4, max: 12 })
        .withMessage('username must be more than 4 and less than 12 characters')
        .matches(/^[a-z0-9_-]{4,12}$/i)
        .withMessage('username must be letters, numbers, underscores, and dashes'),
    body('password')
        .notEmpty()
        .withMessage('password required')
        .isLength({ min: 8 })
        .withMessage('password must be greater than 8 characters'),
    requestValidator,
    login
)

// Register
router.post('/register',
    body('name')
        .notEmpty()
        .withMessage('name required')
        .isLength({ min: 4, max: 30})
        .withMessage('name must be more than 4 and less than 30 characters'),
    body('username')
        .notEmpty()
        .withMessage('username required')
        .isLength({ min: 4, max: 12 })
        .withMessage('username must be more than 4 and less than 12 characters')
        .matches(/^[a-z0-9_-]{4,12}$/i)
        .withMessage('username must be letters, numbers, underscores, and dashes'),
    body('email')
        .notEmpty()
        .withMessage('email required')
        .isEmail()
        .withMessage('email must be a valid email address'),
    body('whatsapp')
        .notEmpty()
        .withMessage('whatsapp required')
        .isMobilePhone()
        .withMessage('whatsapp must be an active and valid whatsapp number'),
    body('password')
        .notEmpty()
        .withMessage('password required')
        .isLength({ min: 8 })
        .withMessage('password must be greater than 8 characters'),
    requestValidator,
    register
)

// Change Password
router.post('/change-password',
    body('username')
        .notEmpty()
        .withMessage('username required')
        .isLength({ min: 4, max: 12 })
        .withMessage('username must be more than 4 and less than 12 characters')
        .matches(/^[a-z0-9_-]{4,12}$/i)
        .withMessage('username must be letters, numbers, underscores, and dashes'),
    body('oldPassword')
        .notEmpty()
        .withMessage('oldPassword required')
        .isLength({ min: 8 })
        .withMessage('oldPassword must be greater than 8 characters'),
    body('newPassword')
        .notEmpty()
        .withMessage('newPassword required')
        .isLength({ min: 8 })
        .withMessage('newPassword must be greater than 8 characters')
)

// Generate Apikey
router.post('/generate-apikey',
    body('username')
        .notEmpty()
        .withMessage('username required')
        .isLength({ min: 4, max: 12 })
        .withMessage('username must be more than 4 and less than 12 characters')
        .matches(/^[a-z0-9_-]{4,12}$/i)
        .withMessage('username must be letters, numbers, underscores, and dashes'),
    body('password')
        .notEmpty()
        .withMessage('password required')
        .isLength({ min: 8 })
        .withMessage('password must be greater than 8 characters'),
    requestValidator,
    generateApiKey
)

// Refresh/Replace Apikey
router.post('/refresh-apikey',
    body('apikey')
        .notEmpty()
        .withMessage('apikey required')
        .isLength({ min: 30, max: 64 })
        .withMessage('apikey must be more than 30 and less than 64 characters'),
    requestValidator,
    refreshApiKey
)

module.exports = router;
