const lib = require('../lib/util');

const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');
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
    let isMeetingMaster = false;
    const codes = await CODE.find({ groupId: { $in: [1, 2] } });

    /**===================================================================
     * 내 모임 조회
     ===================================================================*/
    // 사용자가 로그인하지 않은 경우, 빈 오브젝트를 내려준다.
    if (!res.locals.user) {
        response.myMeeting = {};
    } else {
        // 로그인 한 경우, 해당 사용자가 가입한 모임이 있는지 검사한다.
        const userId = res.locals.user.userId;
        const meetings = await MEETINGMEMBER.find({ meetingMemberId: userId });

        // 가입한 모임이 없는 경우, 빈 오브젝트를 내려준다.
        if (meetings.length === 0) {
            response.myMeeting = {};
        } else {
            // 가입한 모임이 있는 경우, 가입한 모임의 meetingId list로 Meetings Collection을 조회한 오브젝트를 내려준다.
            const myMeetingIdList = meetings.map((val, i) => {
                return val.meetingId;
            });

            // 본인이 만든 모임을 가지고 있다면 true 아니면 false를 내려준다.
            isMeetingMaster = meetings
                .map((val, i) => {
                    return val.isMeetingMaster;
                })
                .includes(true);
            if (isMeetingMaster) {
                // 내 모임을 가지고 있는 경우라면,
                // 내 모임이 가장 앞으로 나오게 먼저 결과데이터에 넣어주고, 나머지 데이터를 뒤로 넣어준다.
                const myMetting = await MEETING.find(
                    { meetingMasterId: userId },
                    {
                        _id: false,
                        meetingId: true,
                        meetingName: true,
                        meetingImage: true,
                        meetingCategory: true,
                        meetingLocation: true,
                        meetingIntro: true,
                    }
                );

                response.myMeeting = myMetting.map((val, i) => {
                    const categoryName = codes.find((element) => {
                        if (element.codeId === val.meetingCategory) return true;
                    });

                    const locationName = codes.find((element) => {
                        if (element.codeId === val.meetingLocation) return true;
                    });

                    return {
                        meetingId: val.meetingId,
                        meetingName: val.meetingName,
                        meetingImage: val.meetingImage,
                        meetingCategory: categoryName.codeValue,
                        meetingLocation: locationName.codeValue,
                        meetingIntro: val.meetingIntro,
                    };
                });

                const myMettingList = await MEETING.find(
                    {
                        meetingId: { $in: myMeetingIdList },
                        meetingMasterId: { $ne: userId },
                    },
                    {
                        _id: false,
                        meetingId: true,
                        meetingName: true,
                        meetingImage: true,
                        meetingCategory: true,
                        meetingLocation: true,
                        meetingIntro: true,
                    }
                ).limit(4);

                const arrMyMettingList = myMettingList.map((val) => {
                    const categoryName = codes.find((element) => {
                        if (element.codeId === val.meetingCategory) return true;
                    });

                    const locationName = codes.find((element) => {
                        if (element.codeId === val.meetingLocation) return true;
                    });

                    return {
                        meetingId: val.meetingId,
                        meetingName: val.meetingName,
                        meetingImage: val.meetingImage,
                        meetingCategory: categoryName.codeValue,
                        meetingLocation: locationName.codeValue,
                        meetingIntro: val.meetingIntro,
                    };
                });

                response.myMeeting =
                    response.myMeeting.concat(arrMyMettingList);
            } else {
                // 내 모임을 가지고 있지 않은 경우라면,
                const myMettingList = await MEETING.find(
                    { meetingId: { $in: myMeetingIdList } },
                    {
                        _id: false,
                        meetingId: true,
                        meetingName: true,
                        meetingImage: true,
                        meetingCategory: true,
                        meetingLocation: true,
                        meetingIntro: true,
                    }
                ).limit(5);

                console.log(myMettingList);
                response.myMeeting = myMettingList.map((val) => {
                    const categoryName = codes.find((element) => {
                        if (element.codeId === val.meetingCategory) return true;
                    });

                    const locationName = codes.find((element) => {
                        if (element.codeId === val.meetingLocation) return true;
                    });

                    return {
                        meetingId: val.meetingId,
                        meetingName: val.meetingName,
                        meetingImage: val.meetingImage,
                        meetingCategory: categoryName.codeValue,
                        meetingLocation: locationName.codeValue,
                        meetingIntro: val.meetingIntro,
                    };
                });
            }
        }
    }

    /**===================================================================
     * 오늘 진행하는 모임 조회
     ===================================================================*/
    const todayStudyList = await STUDY.find({
        studyDateTime: { $gt: lib.getDate() },
    }).sort({ studyDateTime: 1 });

    const todayMeetingIdList = todayStudyList.map((val, i) => {
        return val.meetingId;
    });

    // 배열 내 중복 meetingId를 제거한다.
    const arrTodayMeetingList = Array.from(new Set(todayMeetingIdList));

    let arrTodayRandomMeetingId = [];
    for (let i = 0; i < 5; i++) {
        // 메인페이지에 보여주는 모임 개수는 최대 5개다.
        let randomNumber = Math.floor(
            Math.random() * arrTodayMeetingList.length
        );

        if (
            arrTodayRandomMeetingId.indexOf(
                arrTodayMeetingList[randomNumber]
            ) === -1
        ) {
            arrTodayRandomMeetingId.push(arrTodayMeetingList[randomNumber]);
            if (arrTodayMeetingList.length === arrTodayRandomMeetingId.length)
                break;
        } else i--;
    }
    const todayMeetingList = await MEETING.find(
        { meetingId: arrTodayRandomMeetingId },
        {
            _id: false,
            meetingId: true,
            meetingName: true,
            meetingImage: true,
            meetingCategory: true,
            meetingLocation: true,
            meetingIntro: true,
        }
    );

    const resultTodayMeetingList = todayMeetingList.map((val) => {
        const categoryName = codes.find((element) => {
            if (element.codeId === val.meetingCategory) return true;
        });

        const locationName = codes.find((element) => {
            if (element.codeId === val.meetingLocation) return true;
        });

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingCategory: categoryName.codeValue,
            meetingLocation: locationName.codeValue,
            meetingIntro: val.meetingIntro,
        };
    });

    response.todayMeeting = resultTodayMeetingList;

    /**===================================================================
    * 추천 모임 조회
    ===================================================================*/
    response.recommendMeeting = {};
    // 최근 30일 내 스터디를 진행한 모임의 ID를 추출함.
    // 해당 모임의 ID를 통해 전체 모임의 count 값을 구함.
    // count 값으로 랜덤 값 생성하여 랜덤하게 모임을 가져옴.

    // 최근 30일 내 스터디가 있었던 모임 List 추출한 뒤, meetingId를 추출한 array를 생성한다.
    // FIXME: 이 부분은 DB 부하를 줄이기 위해 애초에 중복 값을 제거해서 가지고 올 수 있도록 하면 좋을 듯 하다.
    const recommendStudyList = await STUDY.find({
        studyDateTime: { $gte: lib.getDate(-30, 'days') },
    });
    const arrRecommendMeetingIdList = recommendStudyList.map((val, i) => {
        return val.meetingId;
    });

    // 배열 내 중복 meetingId를 제거한다.
    const arrMeetingList = Array.from(new Set(arrRecommendMeetingIdList));

    let arrRecommendRandomMeetingId = [];
    for (let i = 0; i < 5; i++) {
        // 메인페이지에 보여주는 모임 개수는 5개다.
        let randomNumber = Math.floor(Math.random() * arrMeetingList.length);

        if (
            arrRecommendRandomMeetingId.indexOf(
                arrMeetingList[randomNumber]
            ) === -1
        ) {
            arrRecommendRandomMeetingId.push(arrMeetingList[randomNumber]);
            if (arrMeetingList.length === arrRecommendRandomMeetingId.length)
                break;
        } else i--;
    }

    const recommendMeetingList = await MEETING.find(
        { meetingId: arrRecommendRandomMeetingId },
        {
            _id: false,
            meetingId: true,
            meetingName: true,
            meetingImage: true,
            meetingCategory: true,
            meetingLocation: true,
            meetingIntro: true,
        }
    );

    const resultReccommendMeetingList = recommendMeetingList.map((val) => {
        const categoryName = codes.find((element) => {
            if (element.codeId === val.meetingCategory) return true;
        });

        const locationName = codes.find((element) => {
            if (element.codeId === val.meetingLocation) return true;
        });

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingCategory: categoryName.codeValue,
            meetingLocation: locationName.codeValue,
            meetingIntro: val.meetingIntro,
        };
    });
    response.recommendMeeting = resultReccommendMeetingList;

    /**===================================================================
    * 신규 모임 조회
    ===================================================================*/
    // 모든 모임 중 모임이 생성된 시간을 기준으로 내림차순 정렬하여 데이터를 내려준다.
    const newMettingList = await MEETING.find(
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
    )
        .sort({
            regDate: -1,
        })
        .limit(5);

    const resultNewMettingList = newMettingList.map((val) => {
        const categoryName = codes.find((element) => {
            if (element.codeId === val.meetingCategory) return true;
        });

        const locationName = codes.find((element) => {
            if (element.codeId === val.meetingLocation) return true;
        });

        return {
            meetingId: val.meetingId,
            meetingName: val.meetingName,
            meetingImage: val.meetingImage,
            meetingCategory: categoryName.codeValue,
            meetingLocation: locationName.codeValue,
            meetingIntro: val.meetingIntro,
        };
    });
    response.newMeeting = resultNewMettingList;

    res.status(200).json({
        result: true,
        message: '메인 페이지 조회 성공',
        data: {
            isMeetingMaster,
            response,
        },
    });
}

module.exports = { getSelectMainView };
