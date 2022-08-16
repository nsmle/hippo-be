const db = require("./../../models");
const response = require('./../response.js');

const validate = async (req, res, next) => {
    const apikey = req.query.apikey ?? req.params.id;
    
    const user = await db.User.findOne({
        attributes: ['id' ,'name', 'username', 'phone', 'photo', 'apikey'],
        where: {
            apikey: apikey
        }
    });

    if (user == null) {
        return response(res, 401, false, `Apikey invalid!`);
    }

    res.locals.user = user;
    next();
}

module.exports = validate
