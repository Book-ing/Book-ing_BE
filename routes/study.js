const express = require('express');
const studyController = require('../controllers/studyController');
const studyNoteController = require('../controllers/studyNoteController');
const {
    createOnlineStudyValidation,
    createOfflineStudyValidation,
    updateStudyValidation,
} = require('../middlewares/studyValidator');
const authMiddleware = require('../middlewares/auth-middlewares');
const router = express.Router();

//api/study

//스터디
router.post('/online',
    authMiddleware,
    createOnlineStudyValidation,
    studyController.postOnlineStudy
);
router.post(
    '/offline',
    authMiddleware,
    createOfflineStudyValidation,
    studyController.postOfflineStudy
);
router.put(
    '/',
    authMiddleware,
    updateStudyValidation,
    studyController.updateOfflineStudy
);
router.put('/online', authMiddleware, studyController.updateOnlineStudy)
router.post('/inout', studyController.inoutStudy);
router.get('/:studyId/user', authMiddleware, studyController.getStudyMembers);
router.post('/kickuser', authMiddleware, studyController.kickUser);
router.delete(
    '/:studyId/:meetingId',
    authMiddleware,
    studyController.deleteStudy
);

router.get('/:meetingId/search', authMiddleware, studyController.searchStudy);


//스터디 노트
router.post('/note', authMiddleware, studyNoteController.postNote);
router.put('/note', authMiddleware, studyNoteController.updateNote);

module.exports = router;
