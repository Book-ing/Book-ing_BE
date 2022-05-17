const lib = require('../lib/util');

const USER = require('../schemas/user');
const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');
const STUDYMEMBER = require('../schemas/studyMembers');

/**
 * 2022. 05. 04. HSYOO.
 * FIXME:
 *  1. valid check
 */
async function getSelectMyProfile(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MYPAGE']
    #swagger.summary = '내 프로필 조회 API'
    #swagger.description = '내 프로필사진, 상태메시지 조회'

    #swagger.responses[200] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text', 'data': 'Object' }
    }
    #swagger.responses[400] = {
        description: '존재하지 않는 사용자의 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/
    const { userId } = req.params; 

    const existUser = await USER.findOne(
        { userId: userId },
        {
            _id: false,
            userId: true,
            profileImage: true,
            statusMessage: true,
        }
    );

    if (!existUser)
        return res
            .status(400)
            .json({ result: true, message: '존재하지 않는 사용자입니다.' });

    let resultdata = {
        userId: existUser.userId,
        profileImage: existUser.profileImage,
        statusMessage: existUser.statusMessage,
        isStatusMessage: existUser.statusMessage === '' ? false : true,
    };

    res.json({
        result: true,
        message: '마이페이지 프로필 조회 성공',
        data: resultdata,
    });
}

/**
 * 2022. 05. 05. HSYOO.
 * FIXME:
 *  1. valid check
 */
async function putUpdateMyIntro(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MYPAGE']
    #swagger.summary = '상태메시지 수정 API'
    #swagger.description = '마이페이지 내 상태메시지 수정'

    #swagger.responses[201] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    #swagger.responses[400] = {
        description: '존재하지 않는 사용자의 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/

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
 * 2022. 05. 05. HSYOO.
 * FIXME:
 *  1. valid check(userId:int)
 */
async function getSelectMyMeeting(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MYPAGE']
    #swagger.summary = '내 모임 조회 API'
    #swagger.description = '마이페이지 내 내 모임 조회'

    #swagger.responses[200] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다. 데이터가 존재하지 않는 경우 data는 빈 오브젝트로 응답합니다.',
        schema: { "result": 'Boolean', 'message': 'Text', 'data': 'Object' }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/
    const { userId } = req.params;

    // 결과데이터 오브젝트 선언
    let resultData = {};

    // 내가 만든 모임 조회
    const myMeeting = await MEETING.findOne({ meetingMasterId: userId });

    // 내가 만든 모임이 없다면, 빈 오브젝트를 내려준다.
    if (!myMeeting)
        return res.json({
            result: true,
            message: '마이페이지 내가 만든 모임 조회 성공',
            data: resultData,
        });

    // 내가 만든 모임이 존재한다면, 해당 모임의 가입인원 수, 스터디 발제 수를 구한다.
    const joinedCnt = await MEETINGMEMBER.countDocuments({
        meetingId: myMeeting.meetingId,
    }); // 가입 인원 수
    const studyCnt = await STUDY.countDocuments({
        meetingId: myMeeting.meetingId,
    }); // 스터디 발제 수

    // 결과데이터 생성
    resultData.myMeeting = {
        meetingId: myMeeting.meetingId,
        meetingName: myMeeting.meetingName,
        meetingImage: myMeeting.meetingImage,
        meetingJoinedCnt: joinedCnt,
        meetingStudyCnt: studyCnt,
        meetingIntro: myMeeting.meetingIntro,
    };

    res.json({
        result: true,
        message: '마이페이지 내가 만든 모임 조회 성공',
        data: resultData,
    });
}

/**
 * 2022. 05. 05. HSYOO.
 * FIXME:
 *  1. valid check
 */
async function getSelectJoinedMeeting(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MYPAGE']
    #swagger.summary = '내가 가입한 모임 조회 API'
    #swagger.description = '마이페이지 내 내가 가입한 모임 조회'

    #swagger.responses[200] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다. 데이터가 존재하지 않는 경우 data는 빈 오브젝트로 응답합니다.',
        schema: { "result": 'Boolean', 'message': 'Text', 'data': 'Array' }
    }
    #swagger.responses[400] = {
        description: '존재하지 않는 사용자의 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/
    const { userId } = req.params;

    // 요청한 사용자가 있는지 검사한다.
    const existUser = await USER.find({ userId: userId });
    if (!existUser)
        res.status(400).json({
            result: false,
            message: '존재하지 않는 사용자입니다.',
        });

    // 결과데이터 오브젝트 선언
    let resultData = {};

    // 해당 사용자가 가입되어있는 모임을 조회 후 meetingId로 이루어진 배열로 만든다.
    const arrResultMeeting = await MEETINGMEMBER.find(
        { meetingMemberId: userId },
        { _id: false, meetingId: true }
    );
    const arrJoinedMeetingId = arrResultMeeting.map((val, i) => {
        return val.meetingId;
    });

    // 해당 사용자가 가입되어있는 모임의 정보를 조회한다.
    const arrJoinedMeetingList = await MEETING.find({
        meetingId: arrJoinedMeetingId,
    });
    if (arrJoinedMeetingList === 0) {
        resultData.joinedMeeting = {};
    } else {
        // 미팅 별 가입자 수
        const meetingByJoindedCnt = await MEETINGMEMBER.aggregate([
            { $group: { _id: '$meetingId', count: { $sum: 1 } } },
        ]);

        // 미팅 별 스터디 수
        const meetingByStudyCnt = await STUDY.aggregate([
            { $group: { _id: '$meetingId', count: { $sum: 1 } } },
        ]);

        resultData.joinedMeeting = arrJoinedMeetingList.map((val, i) => {
            const joinedCnt = meetingByJoindedCnt.find((element) => {
                if (element._id === val.meetingId) return true;
            });
            const studyCnt = meetingByStudyCnt.find((element) => {
                if (element._id === val.meetingId) return true;
            });

            return {
                meetingId: val.meetingId,
                meetingName: val.meetingName,
                meetingImage: val.meetingImage,
                meetingJoinedCnt: joinedCnt.count,
                meetingStudyCnt: studyCnt.count,
                meetingIntro: val.meetingIntro,
            };
        });
    }

    res.json({
        result: true,
        message: '마이페이지 내가 가입된 모임 조회 성공',
        data: resultData,
    });
}

/**
 * 2022. 05. 06. HSYOO.
 * FIXME:
 *  1. valid check
 */
async function getSelectMyStudy(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MYPAGE']
    #swagger.summary = '내 스터디 조회 API'
    #swagger.description = '마이페이지 내 내 스터디 조회'

    #swagger.responses[200] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다. 데이터가 존재하지 않는 경우 data는 빈 오브젝트로 응답합니다.',
        schema: { "result": 'Boolean', 'message': 'Text', 'data': 'Object' }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/
    const { userId } = req.params;

    // 유저 존재여부 검사
    const existUser = await USER.findOne({ userId: userId });
    if (!existUser)
        return res.json({
            result: false,
            message: '존재하지 않는 사용자입니다.',
        });

    // 결과데이터 오브젝트 선언
    let resultData = {};
    const arrMyStudy = await STUDY.find(
        { studyMasterId: userId },
        {
            _id: false,
            studyId: true,
            studyTitle: true,
            studyDateTime: true,
            studyAddr: true,
            studyAddrDetail: true,
            studyNotice: true,
            studyPrice: true,
        }
    );

    if (arrMyStudy.length === 0)
        // 해당 사용자가 발제한 스터디가 없다면 성공처리하여 빈 오브젝트를 내려준다.
        return res.json({ result: true, message: '', data: resultData });
    // 발제한 스터디 결과 배열을 결과데이터에 초기화
    else resultData.myStudy = arrMyStudy;

    res.json({
        result: true,
        message: '마이페이지 내가 만든 스터디 조회 성공',
        data: resultData,
    });
}

/**
 * 2022. 05. 06. HSYOO.
 * FIXME:
 *  1. valid check
 */
async function getSelectJoinedStudy(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MYPAGE']
    #swagger.summary = '내가 참여한 스터디 조회 API'
    #swagger.description = '마이페이지 내 내가 참여한 스터디 조회'

    #swagger.responses[200] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다. 데이터가 존재하지 않는 경우 data는 빈 오브젝트로 응답합니다.',
        schema: { "result": 'Boolean', 'message': 'Text', 'data': 'Array' }
    }
    #swagger.responses[400] = {
        description: '존재하지 않는 사용자의 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/
    const { userId } = req.params;

    // 사용자 존재여부 검사
    const existUser = await USER.findOne({ userId: userId });
    if (!existUser)
        return res.json({
            result: false,
            message: '존재하지 않는 사용자입니다.',
        });

    // 결과데이터 오브젝트 선언
    let resultData = {};
    const arrMyStudy = await STUDYMEMBER.find({ studyMemberId: userId });
    const arrStudyIdList = arrMyStudy.map((val, i) => {
        // 내가 참여한 스터디 목록 내 스터디 ID를 배열로 생성
        return val.studyId;
    });

    const arrStudyList = await STUDY.find(
        { studyId: arrStudyIdList },
        {
            _id: false, // mongoDB 내 ID
            studyId: true, // 스터디 ID
            studyTitle: true, // 스터디 제목
            studyDateTime: true, // 스터디 날짜
            studyAddr: true, // 스터디 주소
            studyAddrDetail: true, // 스터디 상세주소
            studyNotice: true, // 스터디 공지
            studyPrice: true, // 스터디 비용
        }
    );
    if (arrStudyList.length === 0)
        // 내가 참여한 스터디가 없다면, 성공으로 처리하여, 빈 오브젝트를 내려준다.
        return res.json({
            resultData: true,
            message: '마이페이지 내가 참여한 스터디 조회 성공',
            data: resultData,
        });
    // 내가 참여한 스터디리스트 배열을 결과데이터에 초기화
    else resultData.joinedStudy = arrStudyList;

    res.json({
        result: true,
        message: '마이페이지 내가 참여한 스터디 조회 성공',
        data: resultData,
    });
}

module.exports = {
    getSelectMyProfile,
    putUpdateMyIntro,
    getSelectMyMeeting,
    getSelectJoinedMeeting,
    getSelectMyStudy,
    getSelectJoinedStudy,
};
