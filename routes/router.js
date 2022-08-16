const { Router } = require('express');
// const sessionsRoute = require('./sessionsRoute.js')
const chatsRoute = require('./chatsRoute.js')
// const groupsRoute = require('./groupsRoute.js')
const userRoute = require('./userRoute.js')
const authRoute = require('./authRoute.js')
const connectionRoute = require('./connectionRoute.js')
const response = require('./../app/http/response.js')

const router = Router()

// router.use('/sessions', sessionsRoute)
router.use('/auth', authRoute)
router.use('/user', userRoute)
router.use('/connection', connectionRoute)
router.use('/chats', chatsRoute)

router.all('*', (req, res) => {
    response(res, 404, false, 'The requested url cannot be found.')
})

module.exports = router;
