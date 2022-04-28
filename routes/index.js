const router = require("express").Router();

const kakao = require('./auth')
const mainRouter = require('./main');

router.use('/auth', kakao)
router.use('/main', mainRouter);
module.exports = router;
