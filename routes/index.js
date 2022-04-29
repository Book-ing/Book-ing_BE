const router = require("express").Router();

const kakao = require('./auth')
const studyRouter = require('./study')
const mainRouter = require('./main');
const meetingRouter = require('./meeting');

router.use('/auth', kakao);
router.use('/study', studyRouter)
router.use('/main', mainRouter);
router.use('/meeting', meetingRouter);

module.exports = router;
