// lib
const jwt = require('jsonwebtoken');
const axios = require('axios');
const lib = require('../lib/util');

// schema
const USER = require('../schemas/user');

/**
 * 2022. 04. 30. HSYOO.
 * TODO:
 *  1. 클라이언트에서 받아온 인가코드를 카카오서버에 검수요청 후 카카오 accessToken key를 받는다.
 *  2. 카카오서버에서 받아온 accessToken key로 카카오사용자정보를 취득한다.
 *  3. 카카오사용자정보로 book-ing DB 내 가입이력이 있는지 검사한다.
 *      3-1. DB 내 가입이력이 있는 경우
 *          - JWT 토큰 발행 (accessToken, refreshToken)
 *          - 해당 사용자정보 DB 업데이트 (카카오서버에서 받아온 사용자 정보 내 nickname, profile_image)
 *      3-2. DB 내 가입이력이 없는 경우
 *          - 카카오사용자정보로 book-ing DB에 사용자정보 생성
 *          - 생성된 사용자정보로 JWT 토큰 발행 (accessToken, refreshToken)
 *  4. 발급된 JWT 토큰을 res 내 쿠키정보에 추가 후 클라이언트 페이지로 리다이렉트
 * FIXME:
 *  1. USER 스키마 내 refreshToken 도큐먼트 required 해지처리 (호진님께 2022. 04. 30. 요청 완)
 */
async function getKakaoLoginCallback(req, res) {
    let getKakaoAccessToken = {};
    let getKakaoUserInfo = {};
    let bookingAccessToken = '';
    let bookingRefreshToken = '';

    try {
        // 클라이언트에서 받아온 인가코드를 카카오서버에 검수요청 후 accessToken key를 받는다.
        getKakaoAccessToken = await axios({
            method: 'POST',
            url: `https://kauth.kakao.com/oauth/token`,
            headers: {
                'content-type':
                    'application/x-www-form-urlencoded;charset=utf-8',
            },
            params: {
                grant_type: 'authorization_code', //특정 스트링
                client_id: process.env.KAKAO_RESTAPI_KEY,
                redirectUri: process.env.KAKAO_REDIRECT_URI,
                client_secret: 'bookingkey',
                code: req.query.code,
            },
        });
    } catch (error) {
        // 어떠한 사유로 인해 accessToken을 받지 못했다면, 서버에 로그를 남기고, 해당 메시지를 클라이언트에 내려준다.
        console.log(error);
        return res
            .status(400)
            .json({
                result: false,
                message:
                    '카카오 accessToken 취득실패 (사유: ' + error.message + ')',
            });
    }

    try {
        // 카카오서버에서 받아온 accessToken key로 카카오사용자정보를 요청한다.
        getKakaoUserInfo = await axios({
            method: 'get',
            url: 'https://kapi.kakao.com/v2/user/me',
            headers: {
                Authorization: `Bearer ${getKakaoAccessToken.data.access_token}`,
            },
        });
    } catch (error) {
        // 어떠한 사유로 인해 사용자정보를 받지 못했다면, 서버에 로그를 남기고, 해당 메시지를 클라이언트에 내려준다.
        console.log(error);
        console.log(getKakaoAccessToken.data.access_token);
        return res
            .status(400)
            .json({
                result: false,
                message:
                    '카카오 사용자정보 취득실패 (사유: ' + error.message + ')',
            });
    }

    // 카카오 서버에서 받아온 카카오 사용자 정보 내 kakaoUserId로 DB 내 가입이력이 있는지 검사한다.
    const existUser = await USER.findOne({
        kakaoUserId: getKakaoUserInfo.data.id,
    });
    if (existUser) {
        // 가입이력이 있는 경우

        //JWT Token을 생성하여 내려준다.
        const payload = {
            kakaoUserId: existUser.kakaoUserId,
            username: existUser.username,
            userId: existUser.userId,
        };
        bookingAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, {
            expiresIn: process.env.VALID_ACCESS_TOKEN_TIME,
        });
        bookingRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
            expiresIn: process.env.VALID_REFRESH_TOKEN_TIME,
        });

        //카카오서버에서 받아온 사용자정보(닉네임, 프로필사진)를 업데이트시켜준다.
        let username = getKakaoUserInfo.data.kakao_account.profile.nickname;
        let profileImage =
            getKakaoUserInfo.data.kakao_account.profile.profile_image_url;
        await USER.updateOne(
            { kakaoUserId: getKakaoUserInfo.data.id },
            { $set: { username, profileImage, bookingRefreshToken } }
        );
    } else {
        //가입이력이 없는 경우

        //DB 내 사용자정보를 추가시킨다.
        const newUser = await USER.create({
            kakaoUserId: getKakaoUserInfo.data.id,
            username: getKakaoUserInfo.data.kakao_account.profile.nickname,
            profileImage:
                getKakaoUserInfo.data.kakao_account.profile.profile_image_url,
            refreshToken: 'temp', // FIXME: 사용자가 생성될 당시에는 refresh token이 존재하지 않기 때문에 null 값을 허용해야한다. (호진님께 요청함)
            regDate: lib.getDate(),
        });

        //JWT Token을 생성하여 내려준다.
        const payload = {
            kakaoUserId: newUser.kakaoUserId,
            username: newUser.username,
            userId: newUser.userId,
        };
        bookingAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN, {
            expiresIn: process.env.VALID_ACCESS_TOKEN_TIME,
        });
        bookingRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
            expiresIn: process.env.VALID_REFRESH_TOKEN_TIME,
        });
    }

    res.cookie('accessToken', bookingAccessToken, {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
    });
    res.cookie('refreshToken', bookingRefreshToken, {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
    });

    res.redirect('/');
}

module.exports = { getKakaoLoginCallback };
