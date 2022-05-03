const jwt = require('jsonwebtoken');
const {accessTokenSign, accessTokenVerify, refreshTokenSign, refreshTokenVerify} = require('../lib/jwt');

const USER = require('../schemas/user');

/**
 * 2022. 05. 03. HSYOO.
 * TODO:
 *  1. 로그인이 필요한 모든 기능에서 해당 미들웨어를 실행한다.
 *  2. 클라이언트에서 해당 사용자의 AceessToken을 받는다.
 *      2-1. 토큰이 정상적으로 입력되었는지 검사한다.
 *  3. 해당 AccessToken의 만료여부를 검사한다.
 * FIXME:
 *  1. 
 */
module.exports = async (req, res, next) => {
    const { authorization, refreshtoken } = req.headers;

    if(!authorization)
        return res.status(401).json({ result: false, message: '로그인이 필요합니다.' });

    if(authorization.split(' ').length !== 2)
        return res.status(401).json({ result: false, message: '요청 헤더 내 authorization 값이 올바르지 않습니다.' });

    const [tokenType, tokenValue] = authorization.split(' ');
    if (tokenType !== 'Bearer')
        return res.status(401).json({ result: false, message: '인증타입이 올바르지 않습니다.' });

    const decoded = jwt.decode(tokenValue);
    if(decoded === null)
        return res.status(401).json({ result: false, message: '권한이 없습니다.' });

    const accessTokenResult = accessTokenVerify(tokenValue);
    if(accessTokenResult.result === true){
        // accessToken이 정상인 경우
        const existUser = await USER.findOne({ userId: accessTokenResult.id});
        // accessToken 내 사용자정보가 DB 내 존재하지 않는다면, 검증실패.
        if(!existUser)
            return res.status(401).json({ result: false, message: '요청한 accessToken 내 사용자정보가 존재하지 않습니다.' });

        res.locals.user = existUser;
        next();
    }else{
        // accessToken이 비정상인 경우
        if(accessTokenResult.message === 'jwt expired'){
            // accessToken이 만료된 경우
            const refreshTokenResult = await refreshTokenVerify(refreshtoken, decoded.userId);
            if(!refreshTokenResult)
                // refreshToken이 비정상이라면, 클라이언트에서 로그인창으로 이동시켜줘야한다.
                return res.status(401).json({ result: false, message: '해당 사용자의 refreshToken이 만료되었습니다. 재로그인이 필요합니다.' });
            else{
                // refreshToken이 정상이고 accessToken이 재발행 되었다면, 클라이언트에서 토큰정보를 갱신하고, 재실행 시켜야한다.
                // 201 Created : 요청이 성공적이었으며 그 결과로 새로운 리소스가 생성되었습니다. 이 응답은 일반적으로 POST 요청 또는 일부 PUT 요청 이후에 따라옵니다.
                return res.status(201).json({ 
                    result: true,
                    message: 'accessToken 재발행 성공.',
                    data: {
                        accessToken: accessTokenSign({userId: decoded.userId}),
                        refreshToken: refreshtoken
                    } 
                });
            }
        }else{
            return res.status(401).json({ result: false, message: 'accessToken이 올바르지 않습니다. 사유: ' + accessTokenResult.message });
        }

    }
};

/** 
 * 2022. 05. 03. HSYOO.
 * 혹시 모르니, 이전 호진님 소스 지우지 않고 가지고 있는다.
 */
// const { verifyToken } = require('./jwt');
// const { verifyRefreshToken } = require('./jwt');
// const User = require('../schemas/user');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// module.exports = {
//     async checkTokens(req, res, next) {
//         if (req.cookies.accessToken === undefined) {
//             return res.status(403).json({
//                 message: '로그인 유효시간이 만료됐습니다 다시 로그인해주세요!',
//             });
//         }
//         const accessToken = verifyToken(req.cookies.accessToken);
//         const refreshToken = verifyRefreshToken(req.cookies.refreshToken);

//         //access token이 만료
//         if (accessToken === null) {
//             if (refreshToken === null) {
//                 //case 1access token과 refresh token이 모두 만료
//                 return res.status(403).json({
//                     message:
//                         '로그인 유효시간이 만료됐습니다 다시 로그인해주세요!',
//                 });
//             } else {
//                 //case 2 access token만료, refresh token 유효
//                 const validrefreshToken = verifyRefreshToken(
//                     req.cookies.refreshToken
//                 );

//                 const { kakaoUserId } = validrefreshToken;
//                 const refreshTokeninDB = await User.findOne({
//                     kakaoUserId,
//                 }).then((token) => token.refreshToken);

//                 //refreshToken으로 찾은 유저
//                 if (refreshTokeninDB === req.cookies.refreshToken) {
//                     const kakaoUser = validrefreshToken;

//                     const kakaoUserId = kakaoUser.kakaoUserId;
//                     const userId = kakaoUser.userId;
//                     const username = kakaoUser.username;

//                     const newAccessToken = jwt.sign(
//                         { kakaoUserId, userId, username },
//                         process.env.ACCESS_TOKEN,
//                         { expiresIn: process.env.VALID_ACCESS_TOKEN_TIME }
//                     );

//                     res.cookie('accessToken', newAccessToken, {
//                         sameSite: 'None',
//                         secure: true,
//                         httpOnly: true,
//                     });
//                     res.cookie('refreshToken', req.cookies.refreshToken, {
//                         sameSite: 'None',
//                         secure: true,
//                         httpOnly: true,
//                     });
//                     req.cookies.accessToken = newAccessToken;
//                     next();
//                 } else {
//                     return res.status(400).json({
//                         result: 'false',
//                         message: '유효하지 않은 유저입니다!',
//                     });
//                 }
//             }
//         } else {
//             //case 3 access token은 유효하지만 refreshToken은 만료
//             //쿠키 지워주고 로그인 페이지로 이동시킨다.
//             if (refreshToken === null) {
//                 res.clearCookie('accessToken');
//                 res.clearCookie('refreshToken');
//                 res.status(403).send({
//                     result: 'false',
//                     message:
//                         '로그인 유효시간이 만료됐습니다 다시 로그인해주세요!',
//                 });
//             } else {
//                 //case 4 둘 다 유효한 경우
//                 next();
//             }
//         }
//     },
// };
