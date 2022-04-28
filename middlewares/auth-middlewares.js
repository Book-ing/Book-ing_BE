const { verifyToken } = require("./jwt");
const { verifyRefreshToken } = require("./jwt");
const User = require('../schemas/user')
const jwt = require("jsonwebtoken")
require('dotenv').config()

module.exports = {
    async checkTokens(req, res, next) {


        if (req.cookies.accessToken === undefined) {
            return res.status(403).json({ message: "토큰이 만료되어 다시 로그인해주세요!" })

        }
        const accessToken = verifyToken(req.cookies.accessToken)
        console.log("엑세스 토큰", accessToken)
        const refreshToken = verifyRefreshToken(req.cookies.refreshToken)
        console.log("리프레쉬 토큰", refreshToken)


        //access token이 만료
        if (accessToken === null) {
            if (refreshToken === null) {
                //case 1access token과 refresh token이 모두 만료
                return res.status(403).json({ message: "토큰이 만료되어 다시 로그인해주세요!" })
            } else {
                //case 2 access token만료, refresh token 유효
                const validrefreshToken = verifyRefreshToken(req.cookies.refreshToken)
                console.log("유저가 누구냐", validrefreshToken)

                const refreshTokeninDB = await RefreshTokenSchema.findOne({ userId }).then((accessToken) => token.accessToken)
                const user = jwt.verify(refreshTokeninDB, process.env.REFRESH_TOKEN);
                const newAccessToken = jwt.sign({ userId: user.userId, nickName: user.nickName }, process.env.ACCESS_TOKEN, { expiresIn: process.env.VALID_ACCESS_TOKEN_TIME })
                // const userInfo = verifyToken(newAccessToken)
                // res.status(200).json({ userInfo, newAccessToken })
                // res.clearCookie('token', accessToken, { domain: process.env.DOMAIN, path: "/" })
                res.cookie('token', newAccessToken, { sameSite: 'None', secure: true, httpOnly: true })
                res.cookie('refreshToken', req.cookies.refreshToken, { sameSite: 'None', secure: true, httpOnly: true })
                req.cookies.token = newAccessToken;

                next()
            }
        } else {
            //access token은 유효
            if (refreshToken === null) {
                //case 3 access token은 유효한데 refresh token은 만료 
                const { userId } = accessToken
                const newRefreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN, { expiresIn: process.env.VALID_REFRESH_TOKEN_TIME })
                await RefreshTokenSchema.findOneAndUpdate({ userId },
                    { token: newRefreshToken },
                    { new: true })
                // res.cookie("token", req.cookies.token, { sameSite: 'None', secure: true, httpOnly: true })
                res.cookie('refreshToken', newRefreshToken, { sameSite: 'None', secure: true, httpOnly: true })
                req.cookies.refreshToken = newRefreshToken;
                next()
            } else {
                //case 4 둘 다 유효한 경우
                next()
            }
        }


    }
}
