const router = require('express').Router();
const meetingController = require('../controllers/meetingController');
const studyController = require('../controllers/studyController');
const { upload } = require('../middlewares/multer');
const {
    createMeetingValidation,
    modifyMeetingValidation,
} = require('../middlewares/validator');
const authMiddleware = require('../middlewares/auth-middlewares');

router.post(
    '/',
    authMiddleware,
    upload.single('meetingImage'),
    createMeetingValidation,
    meetingController.createMeeting
);
router.get('/:meetingId/study', authMiddleware, studyController.getStudyLists);
router.get('/:meetingId', authMiddleware, meetingController.getMeetingInfo);
router.get('/:meetingId/users', authMiddleware, meetingController.getMeetingUsers);
router.post('/inout', authMiddleware, meetingController.inoutMeeting);
router.post('/kickuser', authMiddleware, meetingController.kickMeetingMember);
router.put(
    '/',
    authMiddleware,
    upload.single('meetingImage'),
    modifyMeetingValidation,
    meetingController.modifyMeeting
);
router.delete('/:meetingId', authMiddleware, meetingController.deleteMeeting);

module.exports = router;
