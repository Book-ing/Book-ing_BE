const express = require('express');
const studyController = require('../controllers/studyController');
const studyNoteController = require('../controllers/studyNoteController');
const createStudyValidation = require('../middlewares/studyValidator');
const router = express.Router();

//api/study

//스터디 
router.post('/', createStudyValidation, studyController.postStudy);
router.put('/', studyController.updateStudy);
router.get('/:meetingId/study', studyController.getStudyLists);
router.post('/inout', studyController.inoutStudy);
router.get('/:studyId/user', studyController.getStudyMembers);
router.post('/kickuser', studyController.kickUser);
router.delete('/:studyId/:meetingId', studyController.deleteStudy);

//스터디 노트
router.post('/note', studyNoteController.postNote);
router.put('/note/delete', studyNoteController.deleteNote);
router.put('/note', studyNoteController.updateNote);




module.exports = router;
