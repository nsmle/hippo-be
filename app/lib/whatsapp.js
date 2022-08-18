const {
  default: makeWASocket,
  makeWALegacySocket,
  DisconnectReason,
  useMultiFileAuthState,
  useSingleFileLegacyAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers,
  delay,
  MessageType,
  MessageOptions,
  Mimetype
} = require("@adiwajshing/baileys");
const db = require('./../models');
const Pino = require('pino');
const { join } = require('path');
const { rmSync, readdir, existsSync, mkdirSync, writeFileSync } = require('fs')
const { fileURLToPath } = require('url')
const { toDataURL } = require('qrcode');
const response = require('./../http/response.js')
const Carbon = require("carbonjs");
const qr = require('qr-image');
const axios = require('axios')

const sessions = new Map()
const retries = new Map()
const admin = new Map()

const sessionsDir = (sessionFile = '') => {
    return join(__dirname, "../../.sessions", sessionFile ? sessionFile : '')
}

const isSessionExists = (sessionId) => {
    return sessions.has(sessionId)
}

const getSession = (sessionId) => {
    return sessions.get(sessionId) ?? null
}

!existsSync(sessionsDir()) && mkdirSync(sessionsDir())


let attemptsWhatsAppLog = 0;
const logger = Pino({
    level: 'trace',
    customLevels: { 
    //     trace: 10,
    //     debug: 20,
    //     info: 30,
        whatsapp: 45,
    //     warn: 50,
    //     error: 60,
    //     fatal: 70
    },
    hooks: { logMethod(inputArgs, method, level) {
        if (Boolean(process.env.ENABLE_WHATSAPP_LOGGING) && attemptsWhatsAppLog <= 10) {
            logToWhatsapp(inputArgs, method, level);
        } else {
            setTimeout(() => {
                logToWhatsapp(inputArgs, method, level);
            }, 40000)
        }
        return method.apply(this, inputArgs)
    }},
    options: {
        colorize: true,
        translateTime: 'SYS:standard',
    }
}, Pino.destination('.sessions/whatsapp.log'));

const logToWhatsapp = async (inputArgs, method, level) => {
    const sock = admin.get('admin');
    const inputMessage = typeof inputArgs[0] === 'string' ? inputArgs[0] : inputArgs[1];
    const inputData = typeof inputArgs[0] === 'object' ? inputArgs[0] : (typeof inputArgs[1] == 'object') ? inputArgs[1] : inputArgs[2];

    if (level >= 40 && sock !== undefined && sock.ws.readyState && sock.store.state.connection == 'open') {
        try {
            let logMessage = 
                "========== "+ process.env.APP_NAME.toUpperCase() + " LOGGING ==========\n"+
                "*Level* : ```"+ logger.levels.labels[level] +"```\n"

            logMessage += (inputMessage) ? "*Message:* ```"+inputMessage+"```\n" : '';
            logMessage += "*Date* : ```"+ new Carbon().locale("id-ID").format("HH.mm DD/MM/YYYY") +"```\n";
            logMessage += (inputData) ? "*Data* : \n"+JSON.stringify(inputData)+"\n" : '';

            await sock.sendMessage(process.env.JID_WHATSAPP_LOGGING, { text: logMessage })
        } catch (err) {
            console.log(sock.user)
            attemptsWhatsAppLog++;
            console.log(`Logging failled: `, err.message)
        }
    }
}

const shouldReconnect = (sessionId) => {
    let maxRetries = parseInt(process.env.MAX_RETRIES ?? 0)
    let attempts = retries.get(sessionId) ?? 0

    maxRetries = maxRetries < 1 ? 1 : maxRetries

    if (attempts < maxRetries) {
        ++attempts

        console.log('Reconnecting...', { attempts, sessionId })
        retries.set(sessionId, attempts)

        return true
    }

    return false
}

const deleteSession = (sessionId, isLegacy = false) => {
    const sessionFile = (isLegacy ? 'legacy_' : 'md_') + sessionId + (isLegacy ? '.json' : '')
    const storeFile = `${sessionId}_store.json`
    const rmOptions = { force: true, recursive: true }

    rmSync(sessionsDir(sessionFile), rmOptions)
    rmSync(sessionsDir(storeFile), rmOptions)

    sessions.delete(sessionId)
    retries.delete(sessionId)
}

const saveUserState = async (sessionId, state, sock) => {
    db.User.update({state: state}, {
        where: {
            username: sessionId
        }
    });
}

const updateUser = async (sessionId, sock) => {
    const user = await db.User.findOne({ where: { username: sessionId } });

    let ppUrl = null;
    try {
        ppUrl = await sock.profilePictureUrl(sock.user.id, 'image');
    } catch {
    }

    user.update({
        name: (sock.user.name) ? sock.user.name : user.name,
        photo: ppUrl,
    });
}

const startSock = async (sessionId, isLegacy = false, res = null, isAdmin = false) => {
    const sessionFile = (isLegacy ? 'legacy_' : 'md_') + (isAdmin ? 'admin_' : '') + sessionId + (isLegacy ? '.json' : '')
    const store = makeInMemoryStore({ logger })

    let state, saveState

    if (isLegacy) {
        ;({ state, saveState } = useSingleFileLegacyAuthState(sessionsDir(sessionFile)))
    } else {
        ;({ state, saveCreds: saveState } = await useMultiFileAuthState(sessionsDir(sessionFile)))
    }
    
    const config = {
        auth: state,
        printQRInTerminal: true,
        markOnlineOnConnect: false,
        syncFullHistory: true,
        logger,
        browser: Browsers.ubuntu('Chrome'),
    }
    
    const sock = isLegacy ? makeWALegacySocket(config) : makeWASocket(config)

    if (!isLegacy) {
        store.readFromFile(sessionsDir(`${sessionId}_store.json`))
        store.bind(sock.ev)
    }

    sessions.set(sessionId, { ...sock, store, isLegacy, isAdmin })
    if (isAdmin) admin.set('admin', { ...sock, store, isLegacy, isAdmin })

    // credentials updated -- save them
    sock.ev.on('creds.update', async (creds) => {
        await saveState(creds)
        saveUserState(sessionId, state, sock)
    })

    // chat history received
    sock.ev.on('chats.set', ({ chats, isLatest }) => {
        
        if (isLegacy) {
            store.chats.insertIfAbsent(...chats)
        }
        
		console.log(`recv ${chats.length} chats (is latest: ${isLatest})`)
    })
    
    sock.ev.on('presence-update', json => console.log(json))

    // message history received
    sock.ev.on('messages.set', async ({ messages, isLatest }) => {
        console.log(`recv ${messages.length} messages (is latest: ${isLatest})`)
    })

    // received a new message
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0].message
        console.log(message, 'messages.upsert')
    })

    // connection status update
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        const statusCode = lastDisconnect?.error?.output?.statusCode

        const states = ['Connecting', 'Connected', 'Disconnecting', 'Disconnected']
        const state = states[sock?.ws?.readyState];
        console.log(`${state} to :`, { [`${isAdmin ? 'admin' : 'user'}`]: `${sessionId}`})
        logger.whatsapp(`${state} to @${sessionId}`)

        if (connection === 'open') {
            updateUser(sessionId, sock)
            retries.delete(sessionId)
        }

        if (connection === 'close') {
            console.log(statusCode === DisconnectReason.restartRequired ? 0 : parseInt(process.env.RECONNECT_INTERVAL ?? 0))
            if (statusCode === DisconnectReason.loggedOut || !shouldReconnect(sessionId)) {
                if (res && !res?.headersSent) {
                    response(res, 500, false, 'Unable to create session.')
                }
                
                return deleteSession(sessionId, isLegacy)
            }

            setTimeout(
                () => {
                    startSock(sessionId, isLegacy, res, isAdmin)
                },
                statusCode === DisconnectReason.restartRequired ? 0 : parseInt(process.env.RECONNECT_INTERVAL ?? 0)
            )
        }
        
        if (update.qr) {
            if (res && !res.headersSent) {
                try {
                    const qr = await toDataURL(update.qr)

                    response(res, 200, true, 'QR code received, please scan the QR code.', { qr })

                    return
                } catch {
                    response(res, 500, false, 'Unable to create QR code.')
                }
            }

            try {
                await sock.logout()
            } catch {
            } finally {
                deleteSession(sessionId, isLegacy)
            }
        }
    });
}

const getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (e) {
		console.log(`Error : ${e}`)
		logger.whatsapp(`Method get buffer error`, $e)
	}
}

/** 
 * Process
 */
const cleanup = (exitCode, signal) => {
    logger.whatsapp('🇸‌🇪‌🇷‌🇻‌🇪‌🇷‌ 🇸‌🇹‌🇴‌🇵', {exitCode, signal})
    console.log('Running cleanup before exit.')

    
    sessions.forEach((session, sessionId, isAdmin) => {
        if (!session.isLegacy) {
            session.store.writeToFile(sessionsDir(`${isAdmin ? 'admin_' : ''}`+ `${sessionId}_store.json`))
        }
    })

    setTimeout(() => {
        process.exit()
    }, 5000);
}

const init = async (host, port) => {
    const users = await db.User.findAll()
    
    for (const user of users) {
        if (user.state === null) continue;

        if (user.isLegacy) {
            if (!existsSync(sessionsDir(`legacy_${user.username}.json`))) {
                writeFileSync(sessionsDir(`legacy_${user.username}.json`), JSON.stringify(user.state))
            }
        } else {
            if (!existsSync(sessionsDir(`md_${user.admin ? 'admin_' : ''}${user.username}`))) {
                mkdirSync(sessionsDir(`md_${user.admin ? 'admin_' : ''}${user.username}`));
            }
            
            if (!existsSync(sessionsDir(`md_${user.admin ? 'admin_' : ''}${user.username}/creds.json`))) {
                writeFileSync(sessionsDir(`md_${user.admin ? 'admin_' : ''}${user.username}/creds.json`), JSON.stringify(user.state.creds))
                console.log(`Load and write credentials @${user.username} from database`)
            } 
        }
    }
    
    readdir(sessionsDir(), (err, files) => {
        if (err) {
            throw err
        }

        for (const file of files) {
            if ((!file.startsWith('md_') && !file.startsWith('legacy_')) || file.endsWith('_store')) {
                continue
            }

            const filename = file.replace('.json', '')
            const isLegacy = filename.split('_', 1)[0] !== 'md'
            let sessionId = filename.substring(isLegacy ? 7 : 3)
            let isAdmin = (/admin/).test(sessionId);
            sessionId = sessionId.replace('admin_', '')

            startSock(sessionId, isLegacy, null, isAdmin)
            
            if (isAdmin) {
                setTimeout(() => {
                    logger.whatsapp('🇸‌🇪‌🇷‌🇻‌🇪‌🇷‌ 🇸‌🇹‌🇦‌🇷‌🇹‌', { host, port })
                }, 2000)
            }
        }
    });
}

/**
 * Method
 */
const sendTyping = async (sessionId, jid, typingTime = 2000) => {
	const sock = getSession(sessionId);
	
	await sock.presenceSubscribe(jid)
	await delay(200)

	await sock.sendPresenceUpdate('composing', jid)
	await delay(typingTime)

	await sock.sendPresenceUpdate('paused', jid)
}

const sendMessage = async (sessionId, receiver, message, withTyping = false, typingTime) => {
    const sock = getSession(sessionId);
    
    if (withTyping) {
        await sendTyping(sessionId, receiver, 10000)
    }

    try {
        return await sock.sendMessage(receiver, message)
    } catch (err) {
        logger.error(err.message)
        return Promise.reject(null)
    }
}

/**
 * Utils
 */

const isExists = async (sessionId, jid) => {
    const sock = getSession(sessionId);

    try {
        let result

        if (/-/.test(jid)) {
            result = await sock.groupMetadata(jid)

            return Boolean(result.id)
        } else {
            if (sock.isLegacy) {
                result = await sock.isOnWhatsApp(jid)
            } else {
                ;[result] = await sock.onWhatsApp(jid)
            }
        }

        return result.exists
    } catch (err) {
        console.error(err.message)
        return false
    }
}

 
const isWhatsappPhone = async (phone) => {
    const sock = admin.get('admin')
    
    if (sock === undefined) {
        return { error: 'Server error, please try again!' };
    }

    if (sock.isLegacy) {
        return await sock.isOnWhatsApp(phone)
    }
    
    return await sock.onWhatsApp(phone);
}


module.exports = {
    isExists,
    startSock,
    isWhatsappPhone,
    isSessionExists,
    getSession,
    deleteSession,
    sendMessage,
    init,
    cleanup
}