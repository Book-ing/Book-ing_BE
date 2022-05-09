const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwtLib = require('../lib/jwt');
const authMiddleware = require('../middlewares/auth-middlewares');
const authController = require('../controllers/authController');

router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', authController.getKakaoLoginCallback);
router.get('/logincheck', authMiddleware, (req, res) => {
    res.json({ result: true, message: '로그인 정상' });
});
router.get('/refreshtoken', jwtLib.refreshToken);
// router.get('/check', checkTokens);

module.exports = router;
