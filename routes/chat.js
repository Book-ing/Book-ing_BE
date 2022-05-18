const router = require('express').Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/auth-middlewares');

router.get('/:meetingId', authMiddleware, chatController.getChat);

module.exports = router;