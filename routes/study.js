const express = require('express');
const studyController = require('../controllers/studyController');
const studyNoteController = require('../controllers/studyNoteController');
const { createStudyValidation, updateStudyValidation } = require('../middlewares/studyValidator');
const authMiddleware = require('../middlewares/auth-middlewares');
const router = express.Router();

//api/study

//스터디
router.post(
    '/',
    authMiddleware,
    createStudyValidation,
    studyController.postStudy
);
router.put(
    '/',
    authMiddleware,
    updateStudyValidation,
    studyController.updateStudy
);
router.post('/inout', authMiddleware, studyController.inoutStudy);
router.get('/:studyId/user', studyController.getStudyMembers);
router.post('/kickuser', authMiddleware, studyController.kickUser);
router.delete(
    '/:studyId/:meetingId',
    authMiddleware,
    studyController.deleteStudy
);

//스터디 노트
router.post('/note', authMiddleware, studyNoteController.postNote);
router.put('/note/delete', authMiddleware, studyNoteController.deleteNote);
router.put('/note', authMiddleware, studyNoteController.updateNote);

module.exports = router;
