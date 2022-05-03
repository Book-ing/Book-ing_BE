const express = require('express');
const studyController = require('../controllers/studyController');
const studyNoteController = require('../controllers/studyNoteController');
const createStudyValidation = require('../middlewares/studyValidator');
const router = express.Router();

//api/study

router.post('/', createStudyValidation, studyController.postStudy);
router.put('/', studyController.updateStudy);
router.get('/:meetingId/study', studyController.getStudyLists);
router.post('/inout', studyController.inoutStudy);
router.get('/:studyId/user', studyController.getStudyMembers);
router.post('/kickuser', studyController.kickUser);
router.delete('/:studyId', studyController.deleteStudy);
router.post('/note', studyNoteController.postNote);




module.exports = router;
