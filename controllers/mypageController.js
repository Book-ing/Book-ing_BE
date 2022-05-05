const lib = require('../lib/util');

const USER = require('../schemas/user');
const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');

/**
 * TODO:
 *  1.
 * FIXME:
 *  1.
 */
async function getSelectMyProfile(req, res) {
    const { userId } = req.params;
    // let responseData = {};

    const myProfile = await USER.find(
        { userId: userId },
        {
            _id: false,
            userId: true,
            profileImage: true,
            statusMessage: true,
        }
    );
    myProfile.isStatusMessage = true;
    // let responseData = myProfile;

    // if(myProfile.statusMessage) {
    //     console.log('1');
    //     myProfile.isStatusMessage = true;
    // }else{
    //     console.log('2');
    //     myProfile.isStatusMessage = true;
    // }

    // // let tempObject = {};
    // // tempObject.test = true;
    console.log(myProfile);
    console.log(myProfile.isStatusMessag1e);

    res.json({
        result: true,
        message: '마이페이지 프로필 조회 성공',
        data: myProfile,
    });
}

/**
 * TODO:
 *  1. 클라이언트에서 userId, statusMessage를 받는다.
 *  2. 해당 값이 정상적으로 들어왔는지 검사한다.
 *  3. 값이 정상적으로 들어왔다면, 해당 유저의 상태메시지를 업데이트한다.
 * FIXME:
 *  1. valid check
 */
async function putUpdateMyIntro(req, res) {
    const { userId, statusMessage } = req.body;

    const updateResult = await USER.updateOne(
        { userId: userId },
        {
            $set: {
                statusMessage: statusMessage,
            },
        }
    );
    if (!updateResult)
        res.status(400).json({
            result: false,
            message: '마이페이지 프로필 수정 실패',
        });

    res.status(201).json({
        result: true,
        message: '마이페이지 프로필 수정 성공',
    });
}

/**
 * TODO:
 *  1. 내가 만든 모임을 조회한다.
 *      1-1. 모임이 존재하면 2번 진행
 *      1-2. 모임이 존재하지 않는다면 빈 오브젝트를 내려준다.
 *  2. 내가 만든 모임의 가입인원 수, 스터디 발제 수를 구한다.
 *  3. 조회한 데이터를 취합하여 결과데이터를 만든 뒤 클라이언트에 내려준다.
 * FIXME:
 *  1. valid check(userId:int)
 */
async function getSelectMyMeeting(req, res) {
    const { userId } = req.params;
    console.log(userId);
    // 결과데이터 오브젝트 선언
    let resultData = {};

    // 내가 만든 모임 조회
    const myMeeting = await MEETING.findOne({ meetingMasterId: userId });

    // 내가 만든 모임이 없다면, 빈 오브젝트를 내려준다.
    if(!myMeeting)
        return res.json({ result: true, message: '마이페이지 내가 만든 모임 조회 성공', data: resultData });

    // 내가 만든 모임이 존재한다면, 해당 모임의 가입인원 수, 스터디 발제 수를 구한다.
    const joinedCnt = await MEETINGMEMBER.countDocuments({meetingId: myMeeting.meetingId}); // 가입 인원 수
    const studyCnt = await STUDY.countDocuments({ meetingId: myMeeting.meetingId });        // 스터디 발제 수

    // 결과데이터 생성
    resultData.myMeeting = {
        meetingId: myMeeting.meetingId,
        meetingName: myMeeting.meetingName,
        meetingImage: myMeeting.meetingImage,
        meetingJoinedCnt: joinedCnt,
        meetingStudyCnt: studyCnt,
        meetingIntro: myMeeting.meetingIntro
    };

    res.json({
        result: true,
        message: '마이페이지 내가 만든 모임 조회 성공',
        data: resultData
    });
}

/**
 * TODO:
 *  1.
 * FIXME:
 *  1. valid check
 */
async function getSelectJoinedMeeting(req, res) {
    const { userId } = req.params;

    // 결과데이터 오브젝트 선언
    let resultData = {};

    // 해당 사용자가 가입되어있는 모임을 조회 후 meetingId로 이루어진 배열로 만든다.
    const arrResultMeeting = await MEETINGMEMBER.find({ meetingMemberId: userId}, { _id: false, meetingId: true });
    const arrJoinedMeetingId = arrResultMeeting.map((val, i) => {
        return val.meetingId
    })
    
    // 해당 사용자가 가입되어있는 모임의 정보를 조회한다.
    const arrJoinedMeetingList = await MEETING.find({ meetingId: arrJoinedMeetingId });
    // console.log(arrJoinedMeetingList);

    // 미팅 별 가입자 수
    const meetingByJoindedCnt = await MEETINGMEMBER.aggregate([
        {"$group" : {_id:"$meetingId", count:{$sum:1}}}
    ]);

    // 미팅 별 스터디 수
    const meetingByStudyCnt = await STUDY.aggregate([
        {"$group" : {_id:"$meetingId", count:{$sum:1}}}
    ]);

    resultData.joinedMeeting = arrJoinedMeetingList.map((val, i) => {
        const joinedCnt = meetingByJoindedCnt.find((element) => {
            if(element._id === val.meetingId) return true;
        });
        const studyCnt = meetingByStudyCnt.find((element) => {
            if(element._id === val.meetingId) return true;
        });

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingJoinedCnt: joinedCnt.count,
            meetingStudyCnt: studyCnt.count,
            meetingIntro: val.meetingIntro,
        }
    })

    res.json({ result: true, message: '마이페이지 내가 가입된 모임 조회 성공', data: resultData });
}

/**
 * TODO:
 *  1. 내가 만든 스터디를 조회한다.
 *  2. 조회한 결과 데이터를 정리하여 내려준다.
 * FIXME:
 *  1.
 */
async function getSelectMyStudy(req, res) {
    const { userId } = req.params;

    const myStudy = await STUDY.findOne(
        { userId: userId },
        {
            _id: false,
            studyId: true,
            studyTitle: true,
            studyDateTime: true,
            studyAddr: true,
            studyAddrDetail: true,
            studyNotice: true,
            studyPrice: true
        }
    )

    res.json({ result: true, message: '마이페이지 내가 만든 스터디 조회 성공', data: myStudy });
}

/**
 * TODO:
 *  1.
 * FIXME:
 *  1.
 */
async function getSelectJoinedStudy(req, res) {
    res.send('내가 참여한 스터디 조회 API 구현예정');
}

module.exports = {
    getSelectMyProfile,
    putUpdateMyIntro,
    getSelectMyMeeting,
    getSelectJoinedMeeting,
    getSelectMyStudy,
    getSelectJoinedStudy,
};
