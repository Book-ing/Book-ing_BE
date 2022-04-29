const Meeting = require('../schemas/meeting');
const MeetingMember = require('../schemas/meetingMember');
const Study = require('../schemas/studys');

const lib = require('../lib/util');

/**
 * 2022. 04. 28. HSYOO.
 * TODO:
 *  1. response { {내 모임}, {오늘 진행하는 모임}, {인기 모임}, {신규 모임} } 형식으로 데이터를 내려준다.
 *  2. 내 모임 조회
 *      2-1. 로그인하지 않은 경우
 *         2-1-1. 사용자가 로그인하지 않은 경우에는 내 모임을 볼 수 없기 때문에 빈 오브젝트를 내려준다.
 *      2-2. 로그인한 경우
 *          2-2-1. 사용자가 로그인한 경우 내가 가입한 모임의 리스트를 조회한다.
 *              ㄴ 가입한 모임이 있는 경우 : 가입한 모임의 meetingId 리스트로 모임을 조회하여 오브젝트를 내려준다.
 *              ㄴ 가입한 모임이 없는 경우 : 빈 오브젝트를 내려준다.
 *  3. 오늘 진행하는 모임 조회
 *  4. 인기 모임 조회
 *      4-1. 인기 모임 기준
 *          ㄴ 
 *  5. 신규 모임 조회
 *      5-1. 로그인 여부와 상관없이 무조건 데이터를 내려준다.
 *      5-2. 모임이 생성된 시간을 내림차순 정렬하여 데이터를 내려준다.
 * FIXME:
 *  1. API 명세서 상 기재되어있는 Select 목록과 똑같이 내려줄 것
 *  2. 클라이언트 쿠키 내 ID정보를 취득하여 해당 아이디정보를 검사하도록 바꾼다.
 *      ㄴ 현재는 클라이언트에서 보내준 userId 값 여부로 로그인여부를 검사한다.
 *  3. 스웨거 작업
 * 
 */
async function getSelectMainView(req, res){
    let response = {};

    /**===================================================================
     * 내 모임 조회
     ===================================================================*/
    // 사용자가 로그인하지 않은 경우, 빈 오브젝트를 내려준다.
    if(req.query.userId){ response.myMeeting = {}; }
    else {
        // 로그인 한 경우, 해당 사용자가 가입한 모임이 있는지 검사한다.
        const userId = req.query.userId;
        const meetings = await MeetingMember.find({ MeetingMemberId: userId });

        // 가입한 모임이 없는 경우, 빈 오브젝트를 내려준다.
        if(!meetings){ response.myMeeting = {}; }
        else{
            //가입한 모임이 있는 경우, 가입한 모임의 meetingId list로 Meetings Collection을 조회한 오브젝트를 내려준다.
            const myMeetingIdList = meetings.map((val, i) => { return val.meetingId; });
            const myMettingList = await Meeting.find({ meetingId: { $in: myMeetingIdList } })
            response.myMeeting = myMettingList;
        }
    }

    /**===================================================================
     * 오늘 진행하는 모임 조회
     ===================================================================*/
    const todayStudyList = await Study.find({ RegDt: { $gt: lib.getDate() }}).sort({ regDate: 1 });
    const todayMeetingIdList = todayStudyList.map((val, i) => { return val.meetingId; });
    const todayMeetingList = await Meeting.find({ meetingId: todayMeetingIdList });
    response.todayMeeting = todayMeetingList;

     /**===================================================================
     * 인기 모임 조회
     ===================================================================*/
     response.recommendMeeting = {};

     /**===================================================================
     * 신규 모임 조회
     ===================================================================*/
     // 모든 모임 중 모임이 생성된 시간을 기준으로 내림차순 정렬하여 데이터를 내려준다.
     const newMettingList = await Meeting.find().sort({ 'regDate': -1 });
     response.newMeeting = newMettingList;

    

    res.status(200).json({ result: true, message: '메인 페이지 조회 성공', data: response });
    
}

module.exports = { getSelectMainView };