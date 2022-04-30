const passport = require('passport');
const moment = require('moment');
require('moment-timezone');
const jwt = require('jsonwebtoken');
moment.tz.setDefault('Asia/Seoul');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../schemas/user');

module.exports = () => {
    passport.use(
        new KakaoStrategy(
            {
                clientID: process.env.KAKAO_RESTAPI_KEY,
                callbackURL: '/api/auth/kakao/callback',
            },

            //카카오서버에서 보낸 카카오 계정정보
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const existUser = await User.findOne({
                        kakaoUserId: profile.id,
                    });

                    //유저가 존재
                    if (existUser) {
                        if (
                            existUser.username !==
                                profile._json.kakao_account.profile.nickname ||
                            existUser.profileImage !==
                                profile._json.kakao_account.profile
                                    .profile_image_url
                        ) {
                            let username =
                                profile._json.kakao_account.profile.nickname;
                            let profileImage =
                                profile._json.kakao_account.profile
                                    .profile_image_url;
                            await User.updateOne(
                                { kakaoUserId: profile.id },
                                { $set: { username, profileImage } }
                            );
                        }
                        done(null, existUser);
                    } else {
                        const newUser = await User.create({
                            kakaoUserId: profile.id,
                            username: profile.username,
                            profileImage:
                                profile._json.kakao_account.profile
                                    .profile_image_url,
                            refreshToken: refreshToken,
                            regDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                            provider: 'kakao',
                        });
                        done(null, newUser);
                    }
                } catch (err) {
                    console.log(err);
                    done(err);
                }
            }
        )
    );
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
};
