const router = require("express").Router();

const kakao = require('./auth')
const meetingRouter = require('./meeting');

router.use('/auth', kakao)
router.use('/meeting', meetingRouter);

module.exports = router;
