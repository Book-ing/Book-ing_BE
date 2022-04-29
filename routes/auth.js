const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { checkTokens } = require("../middlewares/auth-middlewares");
const axios = require('axios');

const USER = require('../schemas/user');

// 지울 것
// const qs = require('qs');
const urlencode = require('urlencode');
// const urlparams = require('url-search-params-polyfill');

//카카오 로그인 페이지 이동
///api/auth/kakao
router.get('/kakao', passport.authenticate('kakao'))
router.get('/check', checkTokens)

///api/auth/kakao/callback
//여기가 이제 로그인을 하는 url 
//열로 들어오면 kakao 전략으로 가서 로그인을 실행한다.

router.get('/kakao/callback', async (req, res) => {
    
        // 클라이언트에서 받아온 인가코드를 카카오 서버에 확인요청한다.
        // 이후 정상 값이 돌아온다면, 클라이언트에 토큰을 내려준다.
        
        const {data} = await axios({
            method: 'POST',
            url: `https://kauth.kakao.com/oauth/token`,
            headers:{
                'content-type':'application/x-www-form-urlencoded;charset=utf-8'
            },
            params:{
                grant_type: 'authorization_code',//특정 스트링
                client_id:process.env.KAKAO_RESTAPI_KEY,
                redirectUri:process.env.KAKAO_REDIRECT_URI,
                client_secret:'bookingkey',
                code:req.query.code,
            }
        })

        const user = await axios({
            method:'get',
            url:'https://kapi.kakao.com/v2/user/me',
            headers:{
                Authorization: `Bearer ${data.access_token}`
            }
        })

        console.log('user:', user.data);

        // //로그인 인증 후 토큰 발급하고 쿠키에 넣어주는 작업 
        // const user = await User.findOne({
        //     kakaoUserId: req.user.kakaoUserId,
        //     username: req.user.username,
        //     userId: req.user.userId
        // })
        // const payload = {
        //     userId: user.userId,
        //     username: user.username,
        //     kakaoUserId: user.kakaoUserId
        // }

        // const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, {
        //     expiresIn: process.env.VALID_ACCESS_TOKEN_TIME
        // })
        // const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
        //     expiresIn: process.env.VALID_REFRESH_TOKEN_TIME
        // })

        // const kakaoUserId = req.user.kakaoUserId

        // await User.updateOne({ kakaoUserId }, { $set: { refreshToken } })


        // res.cookie('accessToken', accessToken, { sameSite: 'None', secure: true, httpOnly: true })
        // res.cookie('refreshToken', refreshToken, { sameSite: 'None', secure: true, httpOnly: true })

        // res.redirect('/');
        res.send('제발 살려주세요.');
    });


module.exports = router;