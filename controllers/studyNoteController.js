const STUDY = require('../schemas/studys');
const STUDYMEMBERS = require('../schemas/studyMembers');
const MEETING = require('../schemas/meeting');
const USER = require('../schemas/user');
const { getDate } = require('../lib/util');
const moment = require('moment')

//💡
//스터디 노트 작성

/**===================================================================
 * 1. 스터디 노트 작성할 때 해당 스터디 유효한지 체크
 * 2. 유저가 유효한지 체크 
 * 3. 스터디 발제자(장)과 모임장만 노트 작성가능한지 체크
 ===================================================================*/
async function postNote(req, res) {
    /*================================================
        #swagger.tags = ['STUDYNOTE']
        #swagger.summary = '스터디 노트 작성  API'
        #swagger.description = '스터디 노트 작성  API'
    ==================================================*/
    const { userId } = res.locals.user;
    const { studyId, studyNote } = req.body;

    // studyStatus a == 스터디 일시 전, b== 스터디 시작 후 24시간 이내 c == 시작부터 24시간 후 
    try {

        let validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            return res.status(403).json({
                result: false,
                message: '해당 스터디가 존재하지 않습니다! ',
            });
        }


        let rightNow = getDate();

        if (validStudy.studyDateTime > rightNow) {
            return res.status(400).json({
                result: false,
                message: '스터디 전이라 노트 작성이 불가합니다'
            })
        }

        //만약 오늘 날짜가 스터디 일시보다 하루가 늦으면 노트 작성 불가
        // let studyTime=new Date(validStudy.studyDateTime)
        // console.log('@@@',typeof(studyTime))
        let studyTime = moment(validStudy.studyDateTime, 'YYYY-MM-DD HH:mm:ss')

        // console.log('시간 차이: ', moment.duration(studyTime.diff(rightNow)).asHours());
        if (moment.duration(studyTime.diff(rightNow)).asHours() <= -24) {
            return res.status(400).json({
                result: false,
                message: '스터디 노트 작성은 스터디 시작 이후 24시간이 지나면 작성이 불가능합니다.'
            })
        }

        //스터디 노트 작성 가능한 자
        let editMaster = [];
        //받은 스터디 아이디의 멤버들 찾음
        let validStudyMembers = [];
        let studyMembers = await STUDYMEMBERS.find({ studyId });
        for (let i = 0; i < studyMembers.length; i++) {
            validStudyMembers.push(studyMembers[i].studyMemberId);
        }


        //받은 스터디의 모임 찾음
        if (!validStudyMembers.includes(Number(userId))) {
            return res.status(403).json({
                result: 'false',
                message: '해당 스터디 참여 멤버가 아닙니다',
            });
        }
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
        // console.log('스터디 노트 작성 가능한 자', editMaster);
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote } });

            /*=====================================================================================
               #swagger.responses[201] = {
                   description: '스터디 노트 작성 완료하면 이 응답을 준다.',
                   schema: { "result": true, 'message':'스터디 노트 작성 완료', }
               }
               =====================================================================================*/
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

        /*=====================================================================================
           #swagger.responses[400] = {
               description: '모든 예외처리를 빗나간 경우 이 응답을 준다.',
               schema: { "result": false, 'message':'스터디 노트 작성 실패', }
           }
           =====================================================================================*/
        return res.status(400).json({
            result: true,
            message: '스터디 노트 작성 실패!!',
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
    /*================================================
        #swagger.tags = ['STUDYNOTE']
        #swagger.summary = '스터디 수정 API'
        #swagger.description = '스터디 수정 API'
    ==================================================*/

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
        // console.log('WWWw', editMaster);
        if (editMaster.includes(Number(userId))) {
            await STUDY.updateOne({ studyId }, { $set: { studyNote } });

            /*=====================================================================================
               #swagger.responses[201] = {
                   description: '스터디 수정을 완료하면 이 응답을 준다.',
                   schema: { "result": true, 'message':'스터디 노트 수정 완료!, }
               }
               =====================================================================================*/
            return res
                .status(201)
                .json({ result: true, message: '스터디 노트 수정 완료!' });
        } else {
            return res.status(400).json({
                result: false,
                message: '스터디 노트 수정은 발제자와 모임장만 가능합니다.',
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            /*=====================================================================================
               #swagger.responses[400] = {
                   description: '모든 예외처리를 빗나간 경우 이 응답을 준다.',
                   schema: { "result": false, 'message':'스터디 노트 수정 실패', }
               }
               =====================================================================================*/
            result: true,
            message: '스터디 노트 수정 실패!!',
        });
    }
}

module.exports = { postNote, updateNote };
