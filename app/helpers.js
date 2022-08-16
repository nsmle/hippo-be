const { dirname: Dirname } = require('path')
const { fileURLToPath } = require('url')

const formatPhone = (phone, isUnFormat = false) => {
    
    if (isUnFormat) {
        phone = phone.replace(/:/, '');
        return phone.replace(/@s.whatsapp.net/, '');
    }
    
    if (phone.endsWith('@s.whatsapp.net')) {
        return phone
    }

    let formatted = phone.replace(/\D/g, '')

    return (formatted += '@s.whatsapp.net')
}

const formatGroup = (group) => {
    if (group.endsWith('@g.us')) {
        return group
    }

    let formatted = group.replace(/[^\d-]/g, '')

    return (formatted += '@g.us')
}

module.exports = {
    formatPhone,
    formatGroup
}