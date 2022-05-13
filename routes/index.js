const router = require('express').Router();

const kakao = require('./auth');
const mainRouter = require('./main');
const studyRouter = require('./study');
const meetingRouter = require('./meeting');
const mypage = require('./mypage');
const search = require('./search');
const chat = require('./chat');

router.use('/study', studyRouter);
router.use('/auth', kakao);
router.use('/main', mainRouter);
router.use('/meeting', meetingRouter);
router.use('/mypage', mypage);
router.use('/search', search);
router.use('/chat', chat);

module.exports = router;
