const passport = require('passport');
const moment = require('moment')
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require("../schemas/user");


module.exports = () => {
    passport.use(
        new KakaoStrategy(
            {
                clientID: process.env.KAKAO_RESTAPI_KEY,
                callbackURL: '/api/auth/kakao/callback'
            },

            async (accessToken, refreshToken, profile, done) => {

                try {
                    const existUser = await User.findOne({ kakaoUserId: profile.id });

                    if (existUser) {
                        done(null, existUser)
                    } else {
                        const newUser = await User.create({
                            kakaoUserId: profile.id,
                            username: profile.username,
                            profileImage: profile._json.properties.profile_image,
                            refreshToken: refreshToken,
                            regDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                            provider: 'kakao',
                        });
                        done(null, newUser)
                    }

                } catch (err) {
                    console.log(err);
                    done(err);
                }
            }
        )
    )
    passport.serializeUser((user, done) => {
        done(null, user.username);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}