const router = require('express').Router();
const meetingController = require('../controllers/meetingController');
const studyController = require('../controllers/studyController');
const upload = require('../middlewares/multer');
const createMeetingValidation = require('../middlewares/validator');

router.post(
    '/',
    upload.single('meetingImage'),
    createMeetingValidation,
    meetingController.createMeeting
);
router.get('/:meetingId/study', studyController.getStudyLists);
router.get('/:meetingId', meetingController.getMeetingInfo);
router.get('/:meetingId/users', meetingController.getMeetingUsers);
router.post('/inout', meetingController.inoutMeeting);
router.post('/kickuser', meetingController.kickMeetingMember);

module.exports = router;
