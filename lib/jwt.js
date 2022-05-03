// lib
const jwt = require('jsonwebtoken');

// schemas
const USER = require('../schemas/user');

function accessTokenSign(user){
    const payload = { userId: user.userId };
    return jwt.sign(payload, process.env.ACCESS_TOKEN, {
        algorithm: 'HS256',
        expiresIn: process.env.VALID_ACCESS_TOKEN_TIME,
    });
}

function accessTokenVerify(token){
    let decoded = null;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        return { result: true, id: decoded.userId };
    } catch (error) {
        return { result: false, message: error.message };
    }
}

function refreshTokenSign(){
    return jwt.sign({}, process.env.REFRESH_TOKEN, {
        algorithm: 'HS256',
        expiresIn: process.env.VALID_REFRESH_TOKEN_TIME
    });
}

async function refreshTokenVerify(token, userId){
    const getUserData = await USER.findOne({ userId: userId });
        try {
            const data = getUserData.refreshToken;
            console.log(token);
            console.log(data);
            console.log(token === data);
            if(token === data){
                try{
                    jwt.verify(token, process.env.REFRESH_TOKEN);
                    return true;
                }catch (error){
                    return false;
                }
            }else{
                return false;
            }
        } catch (error) {
            return false;
        }
}

module.exports = {
    accessTokenSign,
    accessTokenVerify,
    refreshTokenSign,
    refreshTokenVerify
};