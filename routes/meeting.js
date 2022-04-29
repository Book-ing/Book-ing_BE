const router = require('express').Router();
const meetingController = require('../controllers/meetingController');
const upload = require('../middlewares/multer');
const createMeetingValidation = require('../middlewares/validator')

router.post('/', upload.single('meetingImage'), createMeetingValidation, meetingController.createMeeting);
router.get('/:meetingId', meetingController.getMeetingInfo);

module.exports = router;