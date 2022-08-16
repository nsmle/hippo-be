const getProfile = async (req, res) => {
    res.json("your profile");
    // const session = getSession(res.locals.sessionId)
    // const receiver = formatPhone(req.body.receiver)
    // const { message } = req.body

    // try {
    //     const exists = await isExists(session, receiver)

    //     if (!exists) {
    //         return response(res, 400, false, 'The receiver number is not exists.')
    //     }

    //     await sendMessage(session, receiver, message, 0)

    //     response(res, 200, true, 'The message has been successfully sent.')
    // } catch {
    //     response(res, 500, false, 'Failed to send the message.')
    // }
}

module.exports = { 
    getProfile
}