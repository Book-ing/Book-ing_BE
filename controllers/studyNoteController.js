const STUDY = require('../schemas/studys');
const STUDYMEMBERS = require('../schemas/studyMembers');
const MEETING = require('../schemas/meeting');


//스터디 노트 작성
async function postNote(req, res) {
    // const { userId } = res.locals
    const { userId } = req.query;//임시 로그인 유저
    const { studyId, studyNote } = req.body;


    try {
        let studyMaster = [];
        let studyMembers = await STUDYMEMBERS.find({ studyId })
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                studyMaster.push(studyMembers[i].studyMemberId);
            }
        }
        if (studyMaster.includes(Number(userId))) {
            await STUDY.updateOne(
                { studyId },
                { $set: { studyNote } }
            )
            return res.status(201).json({ result: 'true', message: '스터디 노트 작성 완료!' })
        } else {
            return res.status(400).json({
                result: 'false',
                message: '스터디 노트 작성은 발제자만 가능합니다.'
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({
            result: 'true',
            message: '스터디 노트 작성 실패!!'
        })
    }
}

//스터디 노트 삭제
//완전히 삭제하는 게 아니라 노트를 빈값으로 만듦
async function deleteNote(req, res) {
    //임시 로그인유저
    const { userId } = req.query;
    const { studyId } = req.body;

    try {
        //스터디노트를 편집할 수 있는 자
        let editMaster = [];
        //스터디 발제자를 찾음
        const targetStudy = await STUDY.findOne({ studyId })
        let targetMeeting = await MEETING.findOne({ meetingId: targetStudy.meetingId })
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        let studyMembers = await STUDYMEMBERS.find({ studyId })
        editMaster.push(targetMeetingMasterId)
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
        }
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne(
                { studyId },
                { $set: { studyNote: "" } }
            )
            return res.status(201).json({ result: 'true', message: '스터디 삭제 작성 완료!' })
        } else {
            return res.status(400).json({
                result: 'false',
                message: '스터디 노트 삭제는 발제자와 모임장만 가능합니다.'
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({
            result: 'true',
            message: '스터디 노트 삭제 실패!!'
        })
    }

}

//노트 수정하기
async function updateNote(req, res) {
    const { userId } = req.query;//임시 로그인 유저
    const { studyId, studyNote } = req.body;


    try {
        //스터디노트를 편집할 수 있는 자
        let editMaster = [];
        //스터디 발제자를 찾음
        const targetStudy = await STUDY.findOne({ studyId })
        let targetMeeting = await MEETING.findOne({ meetingId: targetStudy.meetingId })
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        let studyMembers = await STUDYMEMBERS.find({ studyId })
        editMaster.push(targetMeetingMasterId)
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
        }
        console.log("WWWw", editMaster)
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne(
                { studyId },
                { $set: { studyNote } }
            )
            return res.status(201).json({ result: 'true', message: '스터디 수정 작성 완료!' })
        } else {
            return res.status(400).json({
                result: 'false',
                message: '스터디 노트 수정은 발제자와 모임장만 가능합니다.'
            })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({
            result: 'true',
            message: '스터디 노트 수정 실패!!'
        })
    }
}






module.exports = { postNote, deleteNote, updateNote };
