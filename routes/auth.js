const express = require('express');
const passport = require('passport');
const router = express.Router();
const { checkTokens } = require("../middlewares/auth-middlewares");
const authController = require('../controllers/authController');

router.get('/kakao', passport.authenticate('kakao'))
router.get('/check', checkTokens)
router.get('/kakao/callback', authController.getKakaoLoginCallback);

module.exports = router;