const STUDY = require('../schemas/studys');
const STUDYMEMBERS = require('../schemas/studyMembers');
const MEETING = require('../schemas/meeting');
const USER = require('../schemas/user');

//💡
//스터디 노트 작성

/**===================================================================
 * 1. 스터디 노트 작성할 때 해당 스터디 유효한지 체크
 * 2. 유저가 유효한지 체크 
 * 3. 스터디 발제자(장)과 모임장만 노트 작성가능한지 체크
 ===================================================================*/
async function postNote(req, res) {
    // const { userId } = req.query;//임시 로그인 유저
    const { userId } = res.locals.user;
    const { studyId, studyNote } = req.body;

    try {
        let validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            return res.status(403).json({
                result: false,
                message: '해당 스터디가 존재하지 않습니다! ',
            });
        }

        const validUser = await USER.findOne({ userId });
        if (!validUser) {
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다! ',
            });
        }

        //스터디 노트 작성 가능한 자
        let editMaster = [];
        // let studyMemberId = [];
        //받은 스터디 아이디의 멤버들 찾음
        let studyMembers = await STUDYMEMBERS.find({ studyId });
        // console.log(`${studyId}에 참여한 사람들`, studyMembers)
        //받은 스터디의 모임 찾음
        // if (!studyMembers.includes(Number(userId))) {
        //     return res.status(403).json({
        //         result: 'false',
        //         message: '해당 스터디 참여 멤버가 아닙니다'
        //     })
        // }
        let targetMeeting = await MEETING.findOne({
            meetingId: validStudy.meetingId,
        });
        //찾은 모임의 모임장 찾음
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        //스터디 노트 작성 가능한 자 넣어줌(스터디장(발제자), 모임장)
        editMaster.push(targetMeetingMasterId);
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
            // studyMemberId.push(studyMembers[i].)
        }
        console.log('스터디 노트 작성 가능한 자', editMaster);
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote } });
            return res
                .status(201)
                .json({ result: true, message: '스터디 노트 작성 완료!' });
        } else {
            return res.status(400).json({
                result: false,
                message: '스터디 노트 작성은 발제자와 모임장만 가능합니다.',
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            result: true,
            message: '스터디 노트 작성 실패!!',
        });
    }
}

//스터디 노트 삭제💡
//노트 삭제는 완전히 삭제하는 게 아니라 노트를 빈값으로 만듦
/**===================================================================
 * 1.스터디 노트 삭제할 때 받은 스터디 유효한지 체크
 * 2. 로그인한 유저 유효한지 체크
 * 3. 스터디장(발제자)과 모임장만 스터디 노트 삭제 가능 
 ===================================================================*/
async function deleteNote(req, res) {
    //임시 로그인유저
    // const { userId } = req.query;
    const { userId } = res.locals.user;
    const { studyId } = req.body;

    try {
        const validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            return res.status(403).json({
                result: false,
                message: '해당 스터디가 존재하지 않습니다! ',
            });
        }

        const validUser = await USER.findOne({ userId });
        if (!validUser) {
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다! ',
            });
        }

        //스터디노트를 편집할 수 있는 자
        let editMaster = [];
        //스터디 발제자를 찾음
        const targetStudy = await STUDY.findOne({ studyId });
        //스터디의 모임을 찾음
        let targetMeeting = await MEETING.findOne({
            meetingId: targetStudy.meetingId,
        });
        //모임장을 찾음
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        let studyMembers = await STUDYMEMBERS.find({ studyId });
        //스터디 노트 편집 가능한 자 넣어줌 (모임장, 스터디장)
        editMaster.push(targetMeetingMasterId);
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
        }
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote: '' } });
            return res
                .status(201)
                .json({ result: true, message: '스터디 삭제 작성 완료!' });
        } else {
            return res.status(400).json({
                result: false,
                message: '스터디 노트 삭제는 발제자와 모임장만 가능합니다.',
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            result: true,
            message: '스터디 노트 삭제 실패!!',
        });
    }
}

//노트 수정하기💡
/**===================================================================
 * 1.스터디 노트 수정할 때 받은 스터디 유효한지 체크
 * 2. 로그인한 유저 유효한지 체크
 * 3. 스터디장(발제자)과 모임장만 스터디 노트 수정 가능 
 ===================================================================*/
async function updateNote(req, res) {
    // const { userId } = req.query;//임시 로그인 유저
    const { userId } = res.locals.user;
    const { studyId, studyNote } = req.body;

    try {
        const validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 스터디 입니다.',
            });
        }
        const validUser = await USER.findOne({ userId });
        if (!validUser) {
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다! ',
            });
        }
        //스터디노트를 편집할 수 있는 자
        let editMaster = [];
        //스터디 발제자를 찾음
        const targetStudy = await STUDY.findOne({ studyId });
        let targetMeeting = await MEETING.findOne({
            meetingId: targetStudy.meetingId,
        });
        //모임장 찾음
        let targetMeetingMasterId = targetMeeting.meetingMasterId;
        let studyMembers = await STUDYMEMBERS.find({ studyId });
        //모임장은 한 명이니 먼저 모임장 넣어줌
        editMaster.push(targetMeetingMasterId);
        //스터디 멤버 수만큼 돌면서 스터디장을 넣어줌
        for (let i = 0; i < studyMembers.length; i++) {
            if (studyMembers[i].isStudyMaster) {
                editMaster.push(studyMembers[i].studyMemberId);
            }
        }
        console.log('WWWw', editMaster);
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote } });
            return res
                .status(201)
                .json({ result: true, message: '스터디 수정 작성 완료!' });
        } else {
            return res.status(400).json({
                result: false,
                message: '스터디 노트 수정은 발제자와 모임장만 가능합니다.',
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            result: true,
            message: '스터디 노트 수정 실패!!',
        });
    }
}

module.exports = { postNote, deleteNote, updateNote };
