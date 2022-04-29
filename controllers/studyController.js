const Study = require('../schemas/studys')
const { getDate } = require('../lib/util')


async function postStudy(req, res) {
    const {
        meetingId,
        studyMasterId,
        studyTitle,
        studyDateTime,
        studyAddr,
        studyAddrDetail,
        studyLimitCnt,
        studyPrice,
        studyNotice,
        studyBookTitle,
        studyBookImg,
        studyBookInfo,
        studyNote
    } = req.body;



    try {

        await Study.create({
            meetingId,
            studyMasterId,
            studyTitle,
            studyDateTime,
            studyAddr,
            studyAddrDetail,
            studyLimitCnt,
            studyPrice,
            studyNotice,
            studyBookImg,
            studyBookTitle,
            studyBookInfo,
            studyNote,
            regDate: getDate(),

        })

        return res.status(201).json({
            result: true,
            message: '스터디 등록 성공'
        });

    } catch (err) {
        console.log(err)
        return res.status(400).json({
            result: 'false',
            message: '스터디 등록 실패!'
        })
    }
}

module.exports = { postStudy }