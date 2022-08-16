const db = require("./../../models");
const { formatPhone } = require('./../../helpers.js');
const response = require('./../response.js');
const bcrypt = require('bcryptjs');
const { generateApiKey: GenerateApiKey } = require('generate-api-key');
const { isWhatsappPhone } = require('./../../lib/whatsapp.js');

const login = async (req, res) => {
    const { username, password } = req.body;
    
    // Find users by username
    const user = await db.User.findOne({
        where: {
            username: username
        }
    });
    
    if (user == null) {
        return response(res, 401, false, `Wrong username or password!`);
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
        return response(res, 401, false, `Wrong username or password!`);
    }
    
    return response(res, 200, true, `Hello ${user.name} (@${user.username}) welcome back:)`, user);
}

const register = async (req, res) => {
    let user = req.body;
    user.phone = formatPhone(user.whatsapp);
    user.password = bcrypt.hashSync(user.password, 8);
    
    const whatsappRegistered = await isWhatsappPhone(req.body.whatsapp);

    if (whatsappRegistered.hasOwnProperty('error') || whatsappRegistered[0] === undefined) {
        return response(res, whatsappRegistered.hasOwnProperty('error') ? 500 : 404, false, whatsappRegistered.hasOwnProperty('error') ? whatsappRegistered.error : 'WhatsApp number is not registered!');
    }

    try {
        await db.User.create(user);
    } catch (err) {
        if (err.name == "SequelizeUniqueConstraintError") {
            return response(res, 400, false, `${err.errors[0].path} ${err.errors[0].value} already exists.`);
        } else {
            return response(res, 400, false, err.parent.detail);
        }
    }

    return response(res, 200, true, 'User Created successfully.')
}

const changePassword = async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    // Find users by username
    const user = await db.User.findOne({
        where: {
            username: username
        }
    });
    
    if (user == null) {
        return response(res, 401, false, `Wrong username or old password!`);
    }
    
    if (!bcrypt.compareSync(oldPassword, user.password)) {
        return response(res, 401, false, `Wrong username or old password!`);
    }
    
    user.update({
        password: bcrypt.hashSync(newPassword, 8)
    });
    await user.save();

    return response(res, 200, true, 'Password changed successfully.')
}

const generateApiKey = async (req, res) => {
    const { username, password } = req.body;
    
    // Find users by username
    const user = await db.User.findOne({
        where: {
            username: username
        }
    });
    
    if (user == null) {
        return response(res, 401, false, `Wrong username or password!`);
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
        return response(res, 401, false, `Wrong username or password!`);
    }
    
    if (user.apikey === null) {
        const apikey = GenerateApiKey({
            method: 'string',
            min: 30,
            max: 64,
            pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-'
        });
        
        user.update({
            apikey: apikey
        }); 
        await user.save();
        
        return response(res, 200, true, `Apikey was successfully generated`, {
            apikey: apikey
        });
    } else {
        return response(res, 200, true, `Apikey already exists`, {
            apikey: user.apikey,
            refreshed_apikey: {
                url: `${req.protocol}://${req.get('host')}${req.baseUrl}/refresh-apikey`,
                method: 'POST',
                body: {
                    apikey: "YOUR_APIKEY"
                }
            }
        });
    }
}

const refreshApiKey = async (req, res) => {
    const { apikey } = req.body;
    
    // Find users by username
    const user = await db.User.findOne({
        where: {
            apikey: apikey
        }
    });
    
    if (user == null) {
        return response(res, 401, false, `Apikey invalid!`);
    }
    
    const newApikey = GenerateApiKey({
        method: 'string',
        min: 30,
        max: 64,
        pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-'
    });
    
    const isApikeyExist = await db.User.findOne({
        where: {
            apikey: newApikey
        }
    }) !== null;
    
    if (isApikeyExist) {
        return response(res, 500, false, `Please try again!`);
    }
    
    user.update({
        apikey: newApikey
    });
    user.save();
    
    return response(res, 200, true, `Apikey was successfully refreshed`, {
        apikey: newApikey
    });
}

module.exports = { 
    login,
    register,
    changePassword,
    generateApiKey,
    refreshApiKey
}