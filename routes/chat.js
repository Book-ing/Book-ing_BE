const router = require('express').Router();
const chatController = require('../controllers/chatController');

router.get('/:meetingId', chatController.getChat);

module.exports = router;
