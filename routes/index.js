const router = require("express").Router();

const kakao = require('./auth')
const mainRouter = require('./main');
const meetingRouter = require('./meeting');

router.use('/auth', kakao);
router.use('/main', mainRouter);
router.use('/meeting', meetingRouter);

module.exports = router;