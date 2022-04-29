const express = require('express');
const studyController = require('../controllers/studyController')
const createStudyValidation = require('../middlewares/studyValidator')
const router = express.Router();



router.post('/', createStudyValidation, studyController.postStudy)


module.exports = router