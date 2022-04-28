const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../schemas/user');
const { checkTokens } = require("../middlewares/auth-middlewares")

//카카오 로그인 페이지 이동
///api/auth/kakao
router.get('/kakao', passport.authenticate('kakao'))
router.get('/check', checkTokens)

///api/auth/kakao/callback
//여기가 이제 로그인을 하는 url 
//열로 들어오면 kakao 전략으로 가서 로그인을 실행한다.

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect: '/',
}),
    async (req, res) => {
        //로그인 인증 후 토큰 발급하고 쿠키에 넣어주는 작업 

        const user = await User.findOne({
            kakaoUserId: req.user.kakaoUserId,
            username: req.user.username,
            userId: req.user.userId
        })
        const payload = {
            userId: user.userId,
            username: user.username,
            kakaoUserId: user.kakaoUserId
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, {
            expiresIn: process.env.VALID_ACCESS_TOKEN_TIME
        })
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
            expiresIn: process.env.VALID_REFRESH_TOKEN_TIME
        })

        const kakaoUserId = req.user.kakaoUserId

        await User.updateOne({ kakaoUserId }, { $set: { refreshToken } })
        // 
        // 

        res.cookie('accessToken', accessToken, { sameSite: 'None', secure: true, httpOnly: true })
        res.cookie('refreshToken', refreshToken, { sameSite: 'None', secure: true, httpOnly: true })

        res.redirect('/');
    });


module.exports = router;