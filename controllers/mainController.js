const lib = require('../lib/util');
const moment = require('moment');

const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');
const STUDYMEMBER = require('../schemas/studyMembers');
const CODE = require('../schemas/codes');

/**
 * 2022. 04. 28. HSYOO.
 * FIXME:
 *  1. 클라이언트 쿠키 내 ID정보를 취득하여 해당 아이디정보를 검사하도록 바꾼다.
 *      ㄴ 현재는 클라이언트에서 보내준 userId 값 여부로 로그인여부를 검사한다.
 *  2. 랜덤 값 조회 시 DB 부하 최소화를 위해 중복 값 제거 해서 가지고 오는 방법 고민한다.
 *
 */
async function getSelectMainView(req, res) {
    /*========================================================================================================
    #swagger.tags = ['MAIN']
    #swagger.summary = '메인페이지 조회 API'
    #swagger.description = '내 모임, 추천 모임, 인기 모임, 신규 모임 4가지 모임 데이터 조회'

    #swagger.responses[200] = {
        description: '정상적인 값을 응답받았을 때, 아래 예제와 같은 형태로 응답받습니다. 데이터가 존재하지 않는 경우 response에는 빈 오브젝트로 응답합니다.',
        schema: { "result": 'Boolean', 'message': 'Text', 'data': { 'isMeetingMaster': 'Boolean', 'response': 'Array' } }
    }
    #swagger.responses[401] = {
        description: '권한이 올바르지 않은 경우 아래와 같은 형태로 응답받습니다.',
        schema: { "result": 'Boolean', 'message': 'Text' }
    }
    ========================================================================================================*/

    let response = {};
    let studylist = {};
    const codes = await CODE.find({ groupId: { $in: [1, 2] } });
    
    /**===================================================================
     * 내 모임 조회
     ===================================================================*/
    // 사용자가 로그인하지 않은 경우, 빈 오브젝트를 내려준다.
    if (!res.locals.user) {
        response.myMeeting = {};
    } else {
        // (기준 데이터) 내 모임을 조회
        const myMeeting = await MEETING.findOne({ meetingMasterId: res.locals.user.userId });
        console.log('myMeeting', myMeeting);
        
        if(!myMeeting){
            response.myMeeting = {};
        }else{
            const myMeetingId = myMeeting.meetingId; // 내 모임 ID
            // meetingId 별 가장 최근에 있었던 스터디의 studyDateTime을 조회
            const arrMyCompleteStudyList = await STUDY.aggregate([
                { $match: { meetingId: myMeetingId } },
                { $group: { _id: '$meetingId', max:{ $max: '$studyDateTime' } } }
            ]);

            // meetingId 별 스터디 수 조회
            const arrMyMeetingByStudyCnt = await STUDY.aggregate ([
                { $match: { meetingId: myMeetingId } },
                { $group: { _id: '$meetingId', count: { $sum: 1} } }
            ]);

            // meetingId 별 가입인원 수 조회
            const arrMyPeopleCnt = await MEETINGMEMBER.aggregate([
                { $match: { meetingId: myMeetingId } },
                { $group: { _id: '$meetingId', count: { $sum: 1} } }
            ]);


            // 카테고리 코드명 매핑
            const myCategoryName = codes.find((element) => {
                if (element.codeId === myMeeting.meetingCategory) return true;
            });
            // 지역 코드명 매핑
            const myLocationName = codes.find((element) => {
                if (element.codeId === myMeeting.meetingLocation) return true;
            });
            // 최근 스터디 일자 매핑
            const myLastStudyTime = arrMyCompleteStudyList.find((element) => {
                if (String(element._id) === String(myMeeting.meetingId)) return true;
            });
            // 모임 별 스터디 수 매핑
            const myMeetingByStudyCnt = arrMyMeetingByStudyCnt.find((element) => {
                if (String(element._id) === String(myMeeting.meetingId)) return true;
            });
            // 모임 별 가입인원 수 매핑
            const myMeetingByPeopleCnt = arrMyPeopleCnt.find((element) => {
                if (String(element._id) === String(myMeeting.meetingId)) return true;
            });

            // 내 모임 결과 데이터 생성
            response.myMeeting = {
                meetingId: myMeeting.meetingId,
                meetingName: myMeeting.meetingName,
                meetingImage: myMeeting.meetingImage,
                meetingCategory: myCategoryName.codeValue,
                meetingLocation: myLocationName.codeValue,
                meetingLastStudyTime: myLastStudyTime === undefined ? '진행된 스터디가 없습니다.' : moment(myLastStudyTime.max).format('YYYY년 MM월 DD일 HH:mm'),
                meetingStudyCnt: myMeetingByStudyCnt === undefined ? 0 : myMeetingByStudyCnt.count,
                meetingPeopleCnt: myMeetingByPeopleCnt === undefined ? 0 : myMeetingByPeopleCnt.count,
                isMeetingRecruit: myMeeting.meetingLimitCnt <= myMeetingByPeopleCnt.count ? '모집 마감' : '모집 중',
                meetingIntro: myMeeting.meetingIntro,
            };

            const myStudyList = await STUDY.aggregate([
                {
                    $project: {
                        _id: false,
                        meetingId: true,
                        studyId: true,
                        studyTitle: true,
                        studyPrice: true,
                        studyDateTime: true,
                        studyAddr: true,
                        studyAddrDetail: true,
                        studyLimitCnt: true,
                        studyType: true,
                    }
                },
                {
                    $match: { meetingId: myMeetingId }
                },
            ]).sort({ studyDateTime: -1 }).limit(4);

            const myStudyIdList = myStudyList.map(val => {
                return val.studyId;
            });

            const arrMyStudyByStudyMemberCntList = await STUDYMEMBER.aggregate([
                { $match: { studyId: { $in: myStudyIdList } } },
                { $group: { _id: '$studyId', count: { $sum: 1 } } }
            ]);

            
            
            studylist = myStudyList.map(val => {
                const MyStudyByStudyMemberCnt = arrMyStudyByStudyMemberCntList.find((element) => {
                    if (String(element._id) === String(val.studyId)) return true;
                });

                return {
                    meetingId: val.meetingId,
                    studyId: val.studyId,
                    studyType: val.studyType,
                    studyTitle: val.studyTitle,
                    studyPrice: val.studyPrice+'원',
                    studyDateTime: moment(val.studyDateTime).format('YYYY년 MM월 DD일 HH:mm'),
                    studyAddr: val.studyAddr+' '+val.studyAddrDetail,
                    studyLimitCnt: `${MyStudyByStudyMemberCnt === undefined ? 0 : MyStudyByStudyMemberCnt.count}명 / ${val.studyLimitCnt}명`
                }
            });
        }
    }

    /**===================================================================
     * 오늘 진행하는 모임 조회
     ===================================================================*/
     // (기준 데이터) 오늘 스터디가 존재하는 스터디를 그룹핑해서 10개를 랜덤으로 조회
    const arrTodayStudyList = await STUDY.aggregate([
        { $match: { studyDateTime: { $gt: lib.getDate()} } },
        { $group: { _id: '$meetingId' } },
        { $sample: { size: 10 } }
    ]);

    // 기준 데이터 내 meetingId를 추출하여 배열로 생성한다.
    const arrTodayMeetingIdList = arrTodayStudyList.map(val => val._id );

    // meetingId 별 가장 최근에 있었던 스터디의 studyDateTime을 조회
    const arrTodayCompleteStudyList = await STUDY.aggregate([
        { $match: { meetingId: { $in: arrTodayMeetingIdList }, studyDateTime: { $lte: lib.getDate() } } },
        { $group: { _id: '$meetingId', max:{ $max: '$studyDateTime' } } }
    ]);

    // meetingId 별 스터디 수 조회
    const arrTodayMeetingByStudyCnt = await STUDY.aggregate ([
        { $match: { meetingId: { $in: arrTodayMeetingIdList } } },
        { $group: { _id: '$meetingId', count: { $sum: 1} } }
    ]);

    // meetingId 별 가입인원 수 조회
    const arrTodayPeopleCnt = await MEETINGMEMBER.aggregate([
        { $match: { meetingId: { $in: arrTodayMeetingIdList } } },
        { $group: { _id: '$meetingId', count: { $sum: 1} } }
    ]);

    const todayMeetingList = await MEETING.find(
        { meetingId: arrTodayMeetingIdList },
        {
            _id: false,
            meetingId: true,
            meetingName: true,
            meetingImage: true,
            meetingCategory: true,
            meetingLocation: true,
            meetingIntro: true,
            meetingLimitCnt: true
        }
    );

    // 결과 데이터 배열 생성
    const resultTodayMeetingList = todayMeetingList.map((val) => {
        // 카테고리 코드명 매핑
        const categoryName = codes.find((element) => {
            if (element.codeId === val.meetingCategory) return true;
        });
        // 지역 코드명 매핑
        const locationName = codes.find((element) => {
            if (element.codeId === val.meetingLocation) return true;
        });
        // 최근 스터디 일자 매핑
        const TodayLastStudyTime = arrTodayCompleteStudyList.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        // 모임 별 스터디 수 매핑
        const TodayMeetingByStudyCnt = arrTodayMeetingByStudyCnt.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        // 모임 별 가입인원 수 매핑
        const TodayMeetingByPeopleCnt = arrTodayPeopleCnt.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        
        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingCategory: categoryName.codeValue,
            meetingLocation: locationName.codeValue,
            meetingLastStudyTime: TodayLastStudyTime === undefined ? '진행된 스터디가 없습니다.' : moment(TodayLastStudyTime.max).format('YYYY년 MM월 DD일 HH:mm'),
            meetingStudyCnt: TodayMeetingByStudyCnt === undefined ? 0 : TodayMeetingByStudyCnt.count,
            meetingPeopleCnt: TodayMeetingByPeopleCnt === undefined ? 0 : TodayMeetingByPeopleCnt.count,
            isMeetingRecruit: val.meetingLimitCnt <= TodayMeetingByPeopleCnt.count ? '모집 마감' : '모집 중',
            meetingIntro: val.meetingIntro,
        };
    });

    response.todayMeeting = resultTodayMeetingList;

    /**===================================================================
    * 추천 모임 조회
    ===================================================================*/
    response.recommendMeeting = {};

    // (기준 데이터) 한달 내 스터디가 존재하는 스터디를 그룹핑해서 10개를 랜덤으로 조회
    const arrRCStudyList = await STUDY.aggregate([
        { $project: { _id: false, meetingId: true, studyDateTime: true } },
        { $match: { studyDateTime: { $gte: lib.getDate(-30, 'days') } } },
        { $group: { _id: '$meetingId', max: { $max: '$studyDateTime' } } },
        { $sample: { size: 10 } } // 덤으로 10개의 값을 출력.
    ]);

    // 기준 데이터 내 meetingId를 추출하여 배열로 생성한다.
    const arrRCStudyIdList = arrRCStudyList.map( val => val._id );

    // meetingId 별 가장 최근에 있었던 스터디의 studyDateTime을 조회
    const arrRCCompleteStudyList = await STUDY.aggregate([
        { $match: { meetingId: { $in: arrRCStudyIdList }, studyDateTime: { $lte: lib.getDate() } } },
        { $group: { _id: '$meetingId', max:{ $max: '$studyDateTime' } } }
    ]);

    // meetingId 별 스터디 수 조회
    const arrRCMeetingByStudyCnt = await STUDY.aggregate ([
        { $match: { meetingId: { $in: arrRCStudyIdList } } },
        { $group: { _id: '$meetingId', count: { $sum: 1} } }
    ]);

    // meetingId 별 가입인원 수 조회
    const arrRCPeopleCnt = await MEETINGMEMBER.aggregate([
        { $match: { meetingId: { $in: arrRCStudyIdList } } },
        { $group: { _id: '$meetingId', count: { $sum: 1} } }
    ]);

    const RCMeetingList = await MEETING.find (
        { meetingId: arrRCStudyIdList },
        {
            _id: false,
            meetingId: true,
            meetingName: true,
            meetingImage: true,
            meetingCategory: true,
            meetingLocation: true,
            meetingIntro: true,
            meetingLimitCnt: true,
        }
    );

    // 결과 데이터 배열 생성
    const resultRCMeetingList = RCMeetingList.map((val) => {
        // 카테고리 코드명 매핑  
        const RCcategoryName = codes.find((element) => { 
            if (String(element.codeId) === String(val.meetingCategory)) return true;
        });
        // 지역 코드명 매핑
        const RClocationName = codes.find((element) => {
            if (String(element.codeId) === String(val.meetingLocation)) return true;
        });
        // 최근 스터디 일자 매핑
        const RCLastStudyTime = arrRCCompleteStudyList.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        // 모임 별 스터디 수 매핑
        const RCMeetingByStudyCnt = arrRCMeetingByStudyCnt.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        // 모임 별 가입인원 수 매핑
        const RCMeetingByPeopleCnt = arrRCPeopleCnt.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingCategory: RCcategoryName.codeValue,
            meetingLocation: RClocationName.codeValue,
            meetingLastStudyTime: RCLastStudyTime === undefined ? '진행된 스터디가 없습니다.' : moment(RCLastStudyTime.max).format('YYYY년 MM월 DD일 HH:mm'),
            meetingStudyCnt: RCMeetingByStudyCnt === undefined ? 0 : RCMeetingByStudyCnt.count,
            meetingPeopleCnt: RCMeetingByPeopleCnt === undefined ? 0 : RCMeetingByPeopleCnt.count,
            isMeetingRecruit: val.meetingLimitCnt <= RCMeetingByPeopleCnt.count ? '모집 마감' : '모집 중',
            meetingIntro: val.meetingIntro
        };
    });
    response.recommendMeeting = resultRCMeetingList;

    /**===================================================================
    * 신규 모임 조회
    ===================================================================*/
    // (기준 데이터) 모든 모임 중 모임이 생성된 시간을 기준으로 내림차순 정렬하여 데이터를 내려준다.
    const arrNewMeetingList = await MEETING.find(
        {},
        {
            _id: false,
            meetingId: true,
            meetingName: true,
            meetingImage: true,
            meetingCategory: true,
            meetingLocation: true,
            meetingIntro: true,
        }
    ).sort({ regDate: -1 }).limit(10);

    // 기준 데이터 내 meetingId를 추출하여 배열로 생성한다.
    const arrNewMeetingIdList = arrNewMeetingList.map(val => val.meetingId );

    // meetingId 별 가장 최근에 있었던 스터디의 studyDateTime을 조회
    const arrNewCompleteStudyList = await STUDY.aggregate([
        { $match: { meetingId: { $in: arrNewMeetingIdList }, studyDateTime: { $lte: lib.getDate() } } },
        { $group: { _id: '$meetingId', max:{ $max: '$studyDateTime' } } }
    ]);

    // meetingId 별 스터디 수 조회
    const arrNewMeetingByStudyCnt = await STUDY.aggregate ([
        { $match: { meetingId: { $in: arrNewMeetingIdList } } },
        { $group: { _id: '$meetingId', count: { $sum: 1} } }
    ]);

    // meetingId 별 가입인원 수 조회
    const arrNewPeopleCnt = await MEETINGMEMBER.aggregate([
        { $match: { meetingId: { $in: arrNewMeetingIdList } } },
        { $group: { _id: '$meetingId', count: { $sum: 1} } }
    ]);

    // 결과 데이터 배열 생성
    const resultNewMeetingList = arrNewMeetingList.map((val) => {
        // 카테고리 코드명 매핑
        const categoryName = codes.find((element) => {
            if (element.codeId === val.meetingCategory) return true;
        });
        // 지역 코드명 매핑
        const locationName = codes.find((element) => {
            if (element.codeId === val.meetingLocation) return true;
        });
        // 최근 스터디 일자 매핑
        const NewLastStudyTime = arrNewCompleteStudyList.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        // 모임 별 스터디 수 매핑
        const NewMeetingByStudyCnt = arrNewMeetingByStudyCnt.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });
        // 모임 별 가입인원 수 매핑
        const NewMeetingByPeopleCnt = arrNewPeopleCnt.find((element) => {
            if (String(element._id) === String(val.meetingId)) return true;
        });

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingCategory: categoryName.codeValue,
            meetingLocation: locationName.codeValue,
            meetingLastStudyTime: NewLastStudyTime === undefined ? '진행된 스터디가 없습니다.' : moment(NewLastStudyTime.max).format('YYYY년 MM월 DD일 HH:mm'),
            meetingStudyCnt: NewMeetingByStudyCnt === undefined ? 0 : NewMeetingByStudyCnt.count,
            meetingPeopleCnt: NewMeetingByPeopleCnt === undefined ? 0 : NewMeetingByPeopleCnt.count,
            isMeetingRecruit: val.meetingLimitCnt <= NewMeetingByPeopleCnt.count ? '모집 마감' : '모집 중',
            meetingIntro: val.meetingIntro,
        };
    });
    response.newMeeting = resultNewMeetingList;

    res.status(200).json({
        result: true,
        message: '메인 페이지 조회 성공',
        data: {
            studylist,
            response,
        },
    });
}

module.exports = { getSelectMainView };
