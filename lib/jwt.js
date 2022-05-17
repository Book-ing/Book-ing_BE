// lib
const jwt = require('jsonwebtoken');

// schemas
const USER = require('../schemas/user');

function accessTokenSign(objUser) {
    const payload = {
        kakaoUserId: objUser.kakaoUserId,
        username: objUser.username,
        userId: objUser.userId,
    };
    return jwt.sign(payload, process.env.ACCESS_TOKEN, {
        algorithm: 'HS256',
        expiresIn: process.env.VALID_ACCESS_TOKEN_TIME,
    });
}

function accessTokenVerify(token) {
    let decoded = null;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        return { result: true, id: decoded.userId };
    } catch (error) {
        return { result: false, message: error.message };
    }
}

function refreshTokenSign(objUser) {
    const payload = {
        kakaoUserId: objUser.kakaoUserId,
        username: objUser.username,
        userId: objUser.userId,
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN, {
        algorithm: 'HS256',
        expiresIn: process.env.VALID_REFRESH_TOKEN_TIME,
    });
}

async function refreshTokenVerify(token, userId) {
    const getUserData = await USER.findOne({ userId: userId });
    try {
        const data = getUserData.refreshToken;
        if (token === data) {
            try {
                jwt.verify(token, process.env.REFRESH_TOKEN);
                return true;
            } catch (error) {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

async function refreshToken(req, res) {
    if (req.headers.authorization) {
        const [refreshTokenType, refreshTokenValue] =
            req.headers.authorization.split(' ');

        const decodeRefreshToken = jwt.decode(refreshTokenValue);

        if (refreshTokenType !== 'Bearer')
            // 클라이언트에서 요청한 refreshToken Type이 Bearer가 아닌 경우 실패처리.
            return res.status(400).json({
                result: false,
                message: '요청타입이 올바르지 않습니다.',
            });

        const verifyRefreshToken = await refreshTokenVerify(
            refreshTokenValue,
            decodeRefreshToken.userId
        );
        if (!verifyRefreshToken)
            //refreshToken을 검사한 뒤, 해당 refreshToken이 만료 또는 정상이 아니라면 다시 로그인시킨다.
            return res.status(401).json({
                result: false,
                message:
                    'refreshToken이 만료되었거나, 유효하지 않습니다. 재로그인이 필요합니다.',
            });

        // 새 accessToken과 refreshToken을 생성한다.
        const objUser = {
            kakaoUserId: decodeRefreshToken.kakaoUserId,
            username: decodeRefreshToken.username,
            userId: decodeRefreshToken.userId,
        };
        const newRefreshToken = refreshTokenSign(objUser);
        const newAccessToken = accessTokenSign(objUser);

        //DB에 새로운 refreshToken을 업데이트 한다.
        const updateResult = await USER.updateOne(
            { kakaoUserId: decodeRefreshToken.kakaoUserId },
            { $set: { refreshToken: newRefreshToken } }
        );

        // DB에 업데이트가 되지 않았다면, 실패처리.
        if (!updateResult)
            return res.status(400).json({
                result: false,
                message: 'refreshToken Update를 수행하지 못했습니다.',
            });

        return res.status(200).json({
            result: true,
            message: 'accessToken 재발행 정상',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    } else {
        // accessToken과 refreshToken 2개 중 하나라도 들어오지 않은 경우 실패처리.
        return res.status(400).json({
            result: false,
            message: '헤더 내 refreshToken 값이 존재하지 않습니다.',
        });
    }
}

module.exports = {
    accessTokenSign,
    accessTokenVerify,
    refreshTokenSign,
    refreshTokenVerify,
    refreshToken,
};
