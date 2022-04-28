const router = require("express").Router();

const kakao = require('./auth')
const study = require('./study')

router.use('/auth', kakao)
router.use('/study', study)


module.exports = router;
