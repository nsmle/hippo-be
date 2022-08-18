const config = require ('dotenv/config');
const express = require('express');
const nodeCleanup = require('node-cleanup');
const fork = require('child_process').fork;
const router = require('./routes/router.js')
const { init, cleanup } = require('./app/lib/whatsapp.js')
const cors = require('cors');

const app = express()

const host = process.env.APP_HOST || process.env.HOST
const port = process.env.APP_PORT || process.env.PORT

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', router)

const listenerCallback = () => {
    console.log(`Server is listening on http://${host}:${port}`)
    init(host, port)
}

if (host) {
    app.listen(port, host, listenerCallback)
} else {
    app.listen(port, listenerCallback)
}


nodeCleanup((exitCode, signal) => {
    cleanup(exitCode, signal);
    return false;
})

module.exports = app;