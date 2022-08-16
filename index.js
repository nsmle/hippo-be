const config = require ('dotenv/config');
const express = require('express');
const nodeCleanup = require('node-cleanup');
const fork = require('child_process').fork;
const router = require('./routes/router.js')
const { init, cleanup } = require('./app/lib/whatsapp.js')
const cors = require('cors');

const app = express()

const host = String(process.env.APP_HOST || undefined)
const port = parseInt(process.env.APP_PORT ?? 5000)

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', router)

app.listen(port, host, () => {
    console.log(`Server is listening on http://${host ? host : 'localhost'}:${port}`)
    init(host, port)
})

/*
process
  .on('SIGTERM', shutdown('SIGTERM'))
  .on('SIGINT', shutdown('SIGINT'))
  .on('uncaughtException', shutdown('uncaughtException'));
*/
nodeCleanup((exitCode, signal) => {
    cleanup(exitCode, signal);
    return false;
})

module.exports = app;