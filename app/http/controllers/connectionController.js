const db = require("./../../models");
const { formatPhone } = require('./../../helpers.js');
const { isSessionExists, getSession, deleteSession, startSock } = require('./../../lib/whatsapp.js');
const response = require('./../response.js');

const connectionConnect = async (req, res) => {
    const isLegacy = (req.query.isLegacy === 'true');
    const user = res.locals.user;

    if (isSessionExists(user.username)) {
        return response(res, 409, false, 'Connection already exist, please disconnect.')
    }

    if (isLegacy !== user.legacy) {
        user.update({
            legacy: isLegacy
        });
    }

    startSock(user.username, isLegacy, res, isLegacy)
}

const connectionStatus = async (req, res) => {
    const states = ['connecting', 'connected', 'disconnecting', 'disconnected']
    const {name, username, phone, photo, apikey} = res.locals.user;
    const session = getSession(username);
    const state = states[session?.ws?.readyState];

    if (state == 'connected') {
        return response(res, 200, true, 'Connection status.', {
            status: state,
            isLegacy: session.isLegacy,
            whatsapp: session.user,
            user: {name, username, phone, photo, apikey}
        });
    }

    return response(res, 200, true, 'Connection status.', { status: state || 'unconnected' });
}

const connectionDisconnect = async (req, res) => {
    const user = res.locals.user;
    const session = getSession(user.username)

    if (!isSessionExists(user.username, res)) {
        return response(res, 404, false, 'Connection not found, please connect!')
    }

    try {
        await session.logout()
    } catch {
    } finally {
        deleteSession(user.username, session.isLegacy)
        user.update({
            state: null
        })
    }

    return response(res, 200, true, 'The connection has been successfully disconnected.')
}

module.exports = { 
    connectionConnect,
    connectionStatus,
    connectionDisconnect
}