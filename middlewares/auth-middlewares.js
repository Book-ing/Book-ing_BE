const { verifyToken } = require("./jwt");
const { verifyRefreshToken } = require("./jwt");
const User = require('../schemas/user');
const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = {
    async checkTokens(req, res, next) {

        if (req.cookies.accessToken === undefined) {
            return res.status(403).json({ message: "로그인 유효시간이 만료됐습니다 다시 로그인해주세요!" })

        }
        const accessToken = verifyToken(req.cookies.accessToken);
        const refreshToken = verifyRefreshToken(req.cookies.refreshToken);


        //access token이 만료
        if (accessToken === null) {
            if (refreshToken === null) {
                //case 1access token과 refresh token이 모두 만료
                return res.status(403).json({ message: "로그인 유효시간이 만료됐습니다 다시 로그인해주세요!" });
            } else {
                //case 2 access token만료, refresh token 유효
                const validrefreshToken = verifyRefreshToken(req.cookies.refreshToken);

                const { kakaoUserId } = validrefreshToken;
                const refreshTokeninDB = await User.findOne({ kakaoUserId }).then((token) => token.refreshToken);

                //refreshToken으로 찾은 유저
                if (refreshTokeninDB === req.cookies.refreshToken) {
                    const kakaoUser = validrefreshToken

                    const kakaoUserId = kakaoUser.kakaoUserId;
                    const userId = kakaoUser.userId;
                    const username = kakaoUser.username

                    const newAccessToken = jwt.sign({ kakaoUserId, userId, username }, process.env.ACCESS_TOKEN, { expiresIn: process.env.VALID_ACCESS_TOKEN_TIME });

                    res.cookie('accessToken', newAccessToken, { sameSite: 'None', secure: true, httpOnly: true });
                    res.cookie('refreshToken', req.cookies.refreshToken, { sameSite: 'None', secure: true, httpOnly: true });
                    req.cookies.accessToken = newAccessToken;
                    next();

                } else {
                    return res.status(400).json({ result: 'false', message: '유효하지 않은 유저입니다!' });
                }
            }
        } else {
            //case 3 access token은 유효하지만 refreshToken은 만료
            //쿠키 지워주고 로그인 페이지로 이동시킨다.
            if (refreshToken === null) {
                res.clearCookie('accessToken',);
                res.clearCookie("refreshToken",);
                res.status(403).send({ result: 'false', message: "로그인 유효시간이 만료됐습니다 다시 로그인해주세요!" });

            } else {
                //case 4 둘 다 유효한 경우
                next();
            }
        }
    }
};
