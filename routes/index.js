const router = require('express').Router();

const kakao = require('./auth');
const mainRouter = require('./main');
const studyRouter = require('./study');
const meetingRouter = require('./meeting');
const mypage = require('./mypage');

router.use('/study', studyRouter);
router.use('/auth', kakao);
router.use('/main', mainRouter);
router.use('/meeting', meetingRouter);
router.use('/mypage', mypage);

module.exports = router;
