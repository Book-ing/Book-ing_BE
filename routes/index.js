const router = require("express").Router();

const kakao = require('./auth')

router.use('/auth', kakao)
module.exports = router;
