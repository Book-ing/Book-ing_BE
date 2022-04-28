const jwt = require('jsonwebtoken');


function verifyToken(token) {
    try {
        const result = jwt.verify(token, process.env.ACCESS_TOKEN);
        return result
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return null
        }
    }
}



function verifyRefreshToken(refreshToken) {
    try {
        const resultr = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
        return resultr
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return null
        }
    }
}


module.exports = { verifyToken, verifyRefreshToken }
