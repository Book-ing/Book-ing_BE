const express = require('express');
const studyController = require('../controllers/studyController')
const router = express.Router();
const multer = require("multer")
const fs = require('fs');
try {
    fs.readdirSync('uploads'); // 폴더 확인
} catch (err) {
    console.error('uploads 폴더가 없습니다. 폴더를 생성합니다.');
    fs.mkdirSync('uploads'); // 폴더 생성
}
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    limiuts: { fileSize: 10 * 1024 * 1024 }
});


router.post('/', upload.single('studyBookImg'), studyController.postStudy)


module.exports = router