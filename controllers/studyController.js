const Study = require('../schemas/studys')
const { body, validationResult } = require('express-validator');

async function postStudy(req, res) {
    const {
        meetingId,
        studyTitle,
        studyDateTime,
        studyAddr,
        studyAddrDetail,
        studyLimitCnt,
        studyPrice,
        studyNotice,
        studyBookTitle,
        studyBookImg,
        studyBookInfo
    } = req.body;

    // if (
    //     studyTitle === ""
    //     || studyTitle === null
    //     || studyDateTime === ""
    //     || studyDateTime === null
    //     || studyAddr === ""
    //     || studyAddr === null
    //     || studyAddrDetail === ""
    //     || studyAddrDetail === null
    //     || studyLimitCnt === ""
    //     || studyLimitCnt === null
    // ) {
    //     return res.status(400).json({
    //         result: 'false',
    //         message: ""
    //     })
    // }

    try {

        await Study.create({
            meetingId,
            studyTitle,
            studyDateTime,
            studyAddr,
            studyAddrDetail,
            studyLimitCnt,
            studyPrice,
            studyNotice,
            studyBookTitle,
            studyBookImg: '/image/' + req.file.filename,
            studyBookInfo
        })

    } catch (err) {
        console.log(err)
        return res.status(400).json({
            result: 'false',
            message: '스터디 등록 실패!'
        })
    }



}

module.exports = { postStudy }