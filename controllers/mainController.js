const MeetingMembers = require('../schemas/meetingMember');

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
 * FIXME:
 *  1. 스웨거 작업
 */
async function getSelectMainView(req, res){
    let response = {};

    // await MeetingMembers.create({
    //     meetingMemberId: 1,
    //     meetingId: 1,
    //     isMeetingMaster: false,
    //     regDate: lib.getDate(),
    // });

    // 사용자가 로그인하지 않은 경우, 빈 오브젝트를 내려준다.
    if(req.query.userId){ response.myMeeting = {}; }
    else {
        // 로그인 한 경우, 해당 사용자가 가입한 모임이 있는지 검사한다.
        const userId = req.query.userId;
        const meetings = await MeetingMembers.find({ MeetingMemberId: userId });

        // 가입한 모임이 없는 경우, 빈 오브젝트를 내려준다.
        if(!meetings){ response.myMeeting = {}; }
        else{
            //가입한 모임이 있는 경우, 가입한 모임의 meetingId list로 Meetings Collection을 조회한 오브젝트를 내려준다.
            console.log(meetings);
        }
    }

    res.status(200).json({ result: true, message: '메인 페이지 조회 성공', data: response });
    
}

module.exports = { getSelectMainView };