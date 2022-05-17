const lib = require('../lib/util');

const USER = require('../schemas/user');
const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');
const STUDYMEMBER = require('../schemas/studyMembers');

/**
 * 2022. 05. 04. HSYOO.
 * TODO:
 *  1. 클라이언트에서 받은 userId로 사용자를 검색한다.
 *      1-1. 사용자가 존재하지 않는다면 실패로 처리하여 내려준다.
 *      1-2. 사용자가 존재한다면 2번 진행
 *  2. 조회한 데이터로 오브젝트 데이터를 생성한다.
 *      2-1. 해당 사용자의 상태메시지가 입력되어있다면 isStatusMessage를 true로, 아니면 false로 설정
 *  3. 위 사항을 모두 처리했다면 성공처리하여 오브젝트 데이터를 내려준다.
 * FIXME:
 *  1. valid check
 */
async function getSelectMyProfile(req, res) {
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
 * TODO:
 *  1. 클라이언트에서 userId, statusMessage를 받는다.
 *  2. 해당 값이 정상적으로 들어왔는지 검사한다.
 *  3. 값이 정상적으로 들어왔다면, 해당 유저의 상태메시지를 업데이트 후 성공처리하여 내려준다.
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
 * 2022. 05. 05. HSYOO.
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
 * TODO:
 *  1. 클라이언트에서 요청한 사용자정보에 대해 DB 내 존재여부 검사
 *      1-1. 사용자정보가 없다면 실패처리하여 내려준다.
 *      1-2. 사용자정보가 있다면 2번 진행
 *  2. 사용자가 가입되어있는 모임을 조회 후 meetingId로 배열 생성
 *  3. 생성한 배열로 해당 사용자가 가입되어있는 모임리스트 조회
 *  4. 미팅 별 가입자 수, 스터디 발제 수 데이터를 조회하고, 조회한
 *      모임리스트로 새로운 오브젝트 데이터 생성 후 성공처리하여 데이터를 내려준다.
 * FIXME:
 *  1. valid check
 */
async function getSelectJoinedMeeting(req, res) {
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
 * TODO:
 *  1. 클라이언트에서 받아온 사용자 존재여부를 검사한다.
 *      1-1. 사용자가 존재하지 않는다면 실패로 처리하여 내려준다.
 *      1-2. 사용자가 존재한다면 2번 진행
 *  2. 내가 만든 스터디를 조회한다.
 *      2-1. 내가 만든 스터디가 존재하지 않는다면 성공으로 처리하여 빈 오브젝트를 내려준다.
 *      2-2. 사용자가 만든 스터디가 존재한다면 3번 진행
 *  3. 조회한 결과데이터를 성공으로 처리하여 데이터가 담긴 오브젝트를 내려준다.
 * FIXME:
 *  1. valid check
 */
async function getSelectMyStudy(req, res) {
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
 * TODO:
 *  1. 클라이언트에서 받아온 사용자 존재여부를 검사한다.
 *      1-1. 사용자가 존재하지 않는다면 실패로 처리하여 내려준다.
 *      1-2. 사용자가 존재한다면 2번 진행
 *  2. 내가 참여한 스터디를 조회한다.
 *      2-1. 내가 참여한 스터디가 존재하지 않는다면 성공으로 처리하여 빈 오브젝트를 내려준다.
 *      2-2. 내가 참여한 스터디가 존재한다면 3번 진행
 *  3. 조회한 결과데이터를 성공으로 처리하여 데이터가 담긴 오브젝트를 내려준다.
 * FIXME:
 *  1. valid check
 */
async function getSelectJoinedStudy(req, res) {
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
