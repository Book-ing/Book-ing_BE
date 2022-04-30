const express = require('express');
const studyController = require('../controllers/studyController')
const createStudyValidation = require('../middlewares/studyValidator')
const router = express.Router();

//api/study


router.post('/', createStudyValidation, studyController.postStudy)
router.put('/', studyController.updateStudy)
router.get('/:meetingId/study', studyController.getStudyLists)
router.post('/joinedstudy', studyController.joinStudy)

module.exports = router