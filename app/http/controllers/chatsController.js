const { formatPhone } = require('./../../helpers.js');
const response = require('./../response.js');
const { isExists, sendMessage: sendWaMessage } = require('./../../lib/whatsapp.js');

const sendMessage = async (req, res) => {
    const { receiver, message, withTyping, typingTime } = await req.body;
    const { username: sessionId } = res.locals.user;

    try {
        const exists = await isExists(sessionId, formatPhone(receiver));

        if (!exists) {
            return response(res, 404, false, 'Receiver is not a whatsapp phone/group!', { error: { receiver } });
        }

        const sendMsg = await sendWaMessage(sessionId, formatPhone(receiver), message, withTyping, typingTime);
        return response(res, 200, true, 'The message has been successfully sent.', sendMsg)
    } catch (err) {
        console.log(err)
        return response(res, 500, false, 'Failed to send the message.')
    }

}

module.exports = { 
    sendMessage,
}