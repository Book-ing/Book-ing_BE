const STUDY = require('../schemas/studys');
const STUDYMEMBERS = require('../schemas/studyMembers');
const USER = require('../schemas/user');
const { getDate } = require('../lib/util');
const MEETING = require('../schemas/meeting');
const BANNEDUSERS = require('../schemas/bannedUsers');
const MEETINGMEMBERS = require('../schemas/meetingMember');
const NodeGeocoder = require('node-geocoder');
/**
 * 2022. 05. 03. HOJIN
 * TODO:
 *
 * //403 ==클라이언트가 콘텐츠에 접근할 권리가 없음
 * //400 == 이 응답은 잘못된 문법으로 인하여 서버가 요청하여 이해할 수 없음을 의미합니다.
 *
 * //200 == 요청이 성공적으로 전달
 * //201 == 요청이 성공적이었으며 그 결과로 새로운 리소스가 생성되었습니다. 이 응답은 일반적으로 POST 요청 또는 일부 PUT 요청 이후에 따라옵니다.
 *
 *
 *
 */

//여기는 모임 안에 들어온 상태다
//스터디 목록 조회💡
/**
 *
 * 2022. 05. 03. HOJIN
 * TODO:
 *  1. 로그인한 유저가 유효한 유저인지 체크
 *  2. 받은 모임이 유효한지 체크
 *
 *
 */
async function getStudyLists(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 조회 API'
        #swagger.description = '스터디 조회 API'
    ========================================================================================================*/
    const { meetingId } = req.params;

    try {
        //해당 모임id 에 있는 전체 스터디 목록 찾기
        //유저가 유효한 유저인지 체크
        const validMeeting = await MEETING.findOne({ meetingId });

        const options = {
            provider: 'google',
            apiKey: process.env.GOOGLE_GEOCODING_APIKEY,
        };
        const geocoder = NodeGeocoder(options);

        //조회하고자 하는 모임이 존재하는 지 체크
        if (!validMeeting) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 모임 id가 유효하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 모임이 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '존재하지 않는 모임입니다.',
            });
        }

        const data = await STUDY.find({ meetingId });
        let studyList = [];


        //해당 모임에 존재하는 전체 스터디들의 데이터를 가지고 온다.
        //한 번 돌 때 하나의 스터디 이다.
        for (let i = 0; i < data.length; i++) {
            const studyId = data[i].studyId;
            const studyTitle = data[i].studyTitle;
            const studyPrice = data[i].studyPrice;
            const studyDateTime = data[i].studyDateTime;
            const studyAddr = data[i].studyAddr;
            const studyAddrDetail = data[i].studyAddrDetail;
            const studyNotice = data[i].studyNotice;
            const studyLimitCnt = data[i].studyLimitCnt;
            const studyBookTitle = data[i].studyBookTitle;
            const studyBookImg = data[i].studyBookImg;
            const studyBookInfo = data[i].studyBookInfo;
            const studyBookWriter = data[i].studyBookWriter;
            const studyBookPurblisher = data[i].studyBookPurblisher;
            const studyNote = data[i].studyNote;
            const regDate = data[i].regDate;

            const regionResult = await geocoder.geocode(data[i].studyAddr);
            const Lat = regionResult[0].latitude; //위도
            const Long = regionResult[0].longitude; //경도


            //모임에 있는 각!! 스터디 아이디에 참여한 멤버들을 가지고 온다.
            people = await STUDYMEMBERS.find({ studyId });
            let studyUserCnt = 0;
            let isStudyJoined = false;

            //유저가 로그인하지 않아도 내용을 볼 수 있도록
            if (res.locals.user) {
                const { userId } = res.locals.user;

                for (let k = 0; k < people.length; k++) {
                    if (people[k].studyMemberId === Number(userId)) {
                        isStudyJoined = true;
                    }
                }
                const validUser = await USER.findOne({ userId });
                if (!validUser) {
                    /*=====================================================================================
                       #swagger.responses[403] = {
                           description: '로그인한 유저가 유효하지 않은 유저일 때 이 응답이 갑니다.',
                           schema: { "result": false, 'message':'유효하지 않은 유저입니다! ', }
                       }
                       =====================================================================================*/
                    return res.status(403).json({
                        result: false,
                        message: '유효하지 않은 유저입니다.',
                    });
                }
            }
            //지금 로그인한 유저가 이 스터디에 참가 했는지 안했는지 판단

            const together = [];
            let isStudyMaster;

            /**===================================================================
          * 해당 스터디에 참가하고 있는 멤버들 조회 
          ===================================================================*/
            //각 스터디에 참여한 멤버들을 유저에서 찾아 유저 아이디와 프로필을 가져오기 위한 것
            //각 스터디에 참여한 멤버들이 마스터인지 아닌지 판단 여부 넣어줌
            //people===스터디에 참여한 사람들
            const studyMasterProfile = {};

            for (let j = 0; j < people.length; j++) {
                let joinedUser = await USER.find({
                    userId: people[j].studyMemberId,
                });
                if (
                    !joinedUser[0] ||
                    joinedUser[0] === null ||
                    joinedUser[0] === undefined
                ) {
                    /*=====================================================================================
                       #swagger.responses[400] = {
                           description: '유저가 존재하지 않을 때 이 응답을 준다.',
                           schema: { "result": false, 'message':'유저가 존재하지 않아요', }
                       }
                       =====================================================================================*/
                    return res.status(400).json({
                        result: false,
                        message: '유저가 존재하지 않아요',
                    });
                }
                const userId = joinedUser[0].userId;
                const profileImage = joinedUser[0].profileImage;
                studyUserCnt = people.length;
                isStudyMaster = people[j].isStudyMaster;
                if (isStudyMaster) {
                    studyMasterProfile.userId = userId;
                    studyMasterProfile.profileImage = profileImage;
                    studyMasterProfile.isStudyMaster = isStudyMaster;
                } else {
                    together.push({
                        userId,
                        isStudyMaster,
                        profileImage,
                    });
                }
            }

            studyList.push({
                studyId,
                studyTitle,
                studyPrice,
                studyDateTime,
                studyAddr,
                isStudyJoined,
                studyAddrDetail,
                studyNotice,
                studyLimitCnt,
                studyUserCnt,
                studyBookTitle,
                studyBookImg,
                studyBookInfo,
                studyBookWriter,
                studyBookPurblisher,
                studyNote,
                studyMasterProfile,
                regDate,
                Lat,
                Long,
                studyMasterProfile,
                together,
            });
        }

        studyList.sort(function (a, b) {
            a = a.regDate;
            b = b.regDate;
            return a > b ? -1 : a < b ? 1 : 0;
        });

        /*=====================================================================================
           #swagger.responses[200] = {
               description: '스터디 조회 성공',
               schema: { "result": true, stidyList}
           }
           =====================================================================================*/
        return res.status(200).json({ result: true, studyList });
    } catch (err) {
        console.log(err);

        /*=====================================================================================
           #swagger.responses[400] = {
               description: '모든 예외처리를 빗나간 경우 이 응답을 준다.',
               schema: { "result": false, 'message':'스터디 목록 조회 실패', }
           }
           =====================================================================================*/
        return res.status(400).json({
            result: false,
            message: '스터디 목록 조회 실패!',
        });
    }
}

//스터디 생성
/**
 * 2022. 05. 03. HOJIN
 * TODO: 💡
 *  1. 스터디 등록 전에 받은 모임 ID가 유효한지 체크
 *  2. 스터디를 등록하려고 하는 유저가 현재 해당 모임에 가입되어 있는 지 체크
 *  3. 스터디를 만든 사람이 해당 스터디장이 된다.
 *  4. 로그인한 유저가 유효한지 체크
 *
 */
async function postStudy(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 생성 API'
        #swagger.description = '스터디 생성 API'
    ========================================================================================================*/
    const { userId } = res.locals.user;

    //스터디 만들때 모임에 가입된 여부 확인로직
    //없는 미팅에 스터디 만들때 체크
    let {
        meetingId,
        studyTitle,
        studyDateTime,
        studyAddr,
        studyAddrDetail,
        studyLimitCnt,
        studyPrice,
        studyNotice,
        studyBookTitle,
        studyBookImg,
        studyBookInfo,
        studyBookWriter,
        studyBookPurblisher,
    } = req.body;

    //스터디를 만든 사람이 방장이 된다.
    try {
        const validUser = await USER.findOne({ userId });
        if (!validUser) {
            /*=====================================================================================
                 #swagger.responses[403] = {
                 description: '로그인한 유저가 유효하지 않은 유저일 때 이 응답이 갑니다.',
                schema: { "result": false, 'message':'유효하지 않은 유저입니다! ', }
                }
            =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다.',
            });
        }
        let validMeeting = await MEETING.findOne({ meetingId });
        if (!validMeeting) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 모임 id가 유효하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 모임이 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 모임입니다.',
            });
        }

        let meetingMembers = await MEETINGMEMBERS.find({ meetingId });
        let meetingMemberId = [];

        //스터디를 만들때 모임이 존재한다면
        for (let i = 0; i < meetingMembers.length; i++) {
            meetingMemberId.push(meetingMembers[i].meetingMemberId);
        }

        //로그인한 유저가 모임에 가입되었는지 아닌지 여부 체크
        if (meetingMemberId.includes(Number(userId))) {
            // 책에 이미지를 넣지 않았다면 기본 이미지를 넣어준다.
            if (studyBookImg === '' || studyBookImg === null) {
                studyBookImg =
                    'https://kuku-keke.com/wp-content/uploads/2020/05/2695_3.png';
            }

            await STUDY.create({
                meetingId,
                studyMasterId: userId,
                studyTitle,
                studyDateTime,
                studyAddr,
                studyAddrDetail,
                studyLimitCnt,
                studyPrice,
                studyNotice,
                studyBookImg,
                studyBookTitle,
                studyBookInfo,
                studyBookWriter,
                studyBookPurblisher,
                regDate: getDate(),
            }).then(
                async (study) =>
                    await STUDYMEMBERS.create({
                        studyMemberId: userId,
                        studyId: study.studyId,
                        isStudyMaster: true,
                        regDate: getDate(),
                    })
            );

            /*=====================================================================================
               #swagger.responses[201] = {
                   description: '스터디 생성에 성공했을 때 이 응답을 준다.',
                   schema: { "result": true, 'message':'스터디 생성 성공', }
               }
               =====================================================================================*/
            return res.status(201).json({
                result: true,
                message: '스터디 생성 성공',
            });
        } else {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '모임에 가입하지 않은 유저가 스터디 생성하려고 할 때 이 응답을 준다..',
                   schema: { "result": false, 'message':'모임에 가입되지 않은 사용자입니다. ', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message:
                    '모임에 가입하지 않으셨습니다 먼저 모임에 가입해주세요!',
            });
        }
    } catch (err) {
        console.log(err);

        /*=====================================================================================
           #swagger.responses[403] = {
               description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
               schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
           }
           =====================================================================================*/
        return res.status(400).json({
            result: false,
            message: '스터디 등록 실패!',
        });
    }
}

/**
 * //스터디 정보 수정 💡
 * 2022. 05. 03. HOJIN
 * TODO:
 *  1. 스터디 정보 수정 하기 전에 유저가 해당 모임에 가입했는 지 여부 체크
 *  2. 스터디 정보 수정 하기 전에 수정하고자 하는 스터디가 존재하는 지 여부 체크
 *  3. 스터디 정보는 스터디장과 모임장만 수정이 가능하도록 만듦
 *  4. 수정하고자 하는 모임이 존재하는 여부 체크
 *  5. 로그인한 유저가 유효한 유저인지 체크
 *  6. 수정하고자 하는 스터디가 모임에 종속되어 있는 지 확인
 *
 */
async function updateStudy(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 정보 수정 API'
        #swagger.description = '스터디 정보 수정 API'
    ========================================================================================================*/
    const { userId } = res.locals.user;

    let {
        studyId,
        studyTitle,
        studyDateTime,
        meetingId,
        studyAddr,
        studyAddrDetail,
        studyPrice,
        studyNotice,
        studyBookTitle,
        studyBookImg,
        studyBookInfo,
        studyBookWriter,
        studyBookPurblisher,
    } = req.body;

    try {
        const validUser = await USER.findOne({ userId });
        if (!validUser) {
            /*=====================================================================================
            #swagger.responses[403] = {
                description: '로그인한 유저가 유효하지 않은 유저일 때 이 응답이 갑니다.',
                schema: { "result": false, 'message':'유효하지 않은 유저입니다! ', }
            }
            =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다.',
            });
        }
        if (studyBookImg === '' || studyBookImg === null) {
            studyBookImg =
                'https://kuku-keke.com/wp-content/uploads/2020/05/2695_3.png';
        }

        const targetStudy = await STUDY.findOne({ studyId });
        if (!targetStudy) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(400).json({
                result: false,
                message: '해당 스터디가 존재하지 않습니다! ',
            });
        }
        let validMeeting = await MEETING.findOne({ meetingId });
        let meetingMembers = await MEETINGMEMBERS.find({ meetingId });
        let meetingMemberId = [];
        //해당 모임에 가입되어 있는 사람들 찾음
        if (!validMeeting) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 모임 id가 유효하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 모임이 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '모임이 존재하지 않습니다.',
            });
        }
        for (let i = 0; i < meetingMembers.length; i++) {
            meetingMemberId.push(meetingMembers[i].meetingMemberId);
        }
        const checkStudy = await STUDY.find({ meetingId });
        let checkStudyId = [];
        for (let i = 0; i < checkStudy.length; i++) {
            checkStudyId.push(checkStudy[i].studyId);
        }

        if (!checkStudyId.includes(Number(studyId))) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 스터디 id가 해당 모임에 없을 때 이 응답을 준다.',
                   schema: { "result": false, 'message':'해당 모임에 있는 스터디가 아닙니다! 수정하실 수 없습니다!', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message:
                    '해당 모임에 있는 스터디가 아닙니다! 수정하실 수 없습니다!',
            });
        }
        const updateStudy = await STUDY.findOne({ studyId });

        //로그인한 유저가 해당 모임에 가입되어 있다면

        if (meetingMemberId.includes(Number(userId))) {
            // 수정하고자 하는 스터디가 존재한다면
            if (updateStudy) {
                if (
                    updateStudy.studyMasterId === Number(userId) ||
                    validMeeting.meetingMasterId === Number(userId)
                ) {
                    await STUDY.updateOne(
                        { studyId },
                        {
                            $set: {
                                studyTitle,
                                studyDateTime,
                                studyAddr,
                                studyAddrDetail,
                                studyPrice,
                                studyNotice,
                                studyBookTitle,
                                studyBookImg,
                                studyBookInfo,
                                studyBookWriter,
                                studyBookPurblisher,
                            },
                        }
                    );

                    /*=====================================================================================
                       #swagger.responses[201] = {
                           description: '스터디 정보 수정이 완료되면 이 응답을 준다.',
                           schema: { "result": true, 'message':'스터디 정보 수정 완료!', }
                       }
                       =====================================================================================*/
                    return res.status(201).json({
                        result: true,
                        message: '스터디 정보 수정 완료!',
                    });
                } else {
                    return res.status(403).json({
                        result: false,
                        message:
                            '스터디 정보 수정은 스터디장 또는 모임장만 가능합니다.',
                    });
                }
            } else {
                /*=====================================================================================
                   #swagger.responses[403] = {
                       description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
                       schema: { "result": false, 'message':'존재하지 않은 스터디에 접근하려고 합니다.', }
                   }
                   =====================================================================================*/
                return res.status(403).json({
                    result: false,
                    message: '존재하지 않은 스터디에 접근하려고 합니다.',
                });
            }
        } else {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '모입에 가입하지 않은 사용자가 스터디를 수정하려고 할 때 이 응답을 준다.',
                   schema: { "result": false, 'message':'해당 모임에 가입되지 않은 유저이다.', }
               }
               =====================================================================================*/
            res.status(403).json({
                result: false,
                message: '해당 모임에 가입되지 않은 유저이다.',
            });
        }
    } catch (err) {
        console.log(err);

        /*=====================================================================================
           #swagger.responses[400] = {
               description: '모든 예외처리를 빗나간 에러는 이 응답을 준다.',
               schema: { "result": false, 'message':'스터디를 수정할 수 없습니다.', }
           }
           =====================================================================================*/
        res.status(400).json({
            result: false,
            message: '스터디를 수정할 수 없습니다!',
        });
    }
}

/**
 * //스터디 참가 및 취소💡
 * 2022. 05. 03. HOJIN
 * TODO:
 *  1. 스터디에 참가하기 전에 유저가 해당 모임에 참가했는 지 여부 체큰
 *  2. 참가하기와 취소하기의 구분은 해당 스터디의 db를 체크해서 없으면 참가 있으면 취소로 정함
 *  3. 참가하고자 하는 스터디가 존재하는 지 여부 체크
 *  4. 참가하고자 하는 모임이 존재하는 지 여부 체크
 *
 */
async function inoutStudy(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 참가 및 취소 API'
        #swagger.description = '스터디 참가 및 취소 API'
    ========================================================================================================*/
    const { userId } = res.locals.user;
    const { studyId, meetingId } = req.body;

    try {
        //받은 모임이 존재하는 지 체크
        const validMeeting = await MEETING.findOne({ meetingId });
        if (!validMeeting) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 모임 id가 유효하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 모임이 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '존재하지 않은 모임입니다. ',
            });
        }
        const validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 스터디입니다',
            });
        }
        //모임안에 있는 스터디들
        const targetStudy = await STUDY.find({ meetingId });
        let targetStudyId = [];
        for (let i = 0; i < targetStudy.length; i++) {
            targetStudyId.push(targetStudy[i].studyId);
        }
        if (!targetStudyId.includes(Number(studyId))) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 스터디 id가 모임에 존재하지 않을 때 이 응답을 준다.',
                   schema: { "result": false, 'message':'해당 모임에 존재하지 않는 스터디이다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '해당 모임에 존재하지 않는 스터디입니다',
            });
        }

        let meetingMemberId = [];
        let meetingMembers = await MEETINGMEMBERS.find({ meetingId });
        for (let i = 0; i < meetingMembers.length; i++) {
            meetingMemberId.push(meetingMembers[i].meetingMemberId);
        }
        if (meetingMemberId.includes(Number(userId))) {
            let master = false;
            //모임에서 강퇴당한 유저 찾기
            let bannedUser = await BANNEDUSERS.findOne({ meetingId });
            // 로그인한 유저가 유효한 유저인지 체크
            const validUser = await USER.findOne({ userId });
            if (!validUser) {
                /*=====================================================================================
                     #swagger.responses[403] = {
                     description: '로그인한 유저가 유효하지 않은 유저일 때 이 응답이 갑니다.',
                    schema: { "result": false, 'message':'유효하지 않은 유저입니다! ', }
                     }
                =====================================================================================*/
                return res.status(403).json({
                    result: false,
                    message: '존재하지 않은 유저입니다.',
                });
            }

            if (bannedUser) {
                if (bannedUser.userId === Number(userId)) {
                    /*=====================================================================================
                       #swagger.responses[403] = {
                           description: '강퇴당한 유저가 다시 스터디에 참가하려고 할 때 이 응답을 준다.',
                           schema: { "result": false, 'message':'강퇴 당하야 해당 스터디에 참가불가능', }
                       }
                       =====================================================================================*/
                    return res.status(403).json({
                        result: false,
                        message:
                            '강퇴 당하셨기 때문에 해당 스터디에 참가하실 수 없습니다.',
                    });
                }
            }
            //참가할 스터디 찾기
            let study = await STUDY.findOne({ studyId });
            if (!study) {
                /*=====================================================================================
                   #swagger.responses[403] = {
                       description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
                       schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
                   }
                   =====================================================================================*/
                return res.status(403).json({
                    result: false,
                    message: '존재하지 않은 스터디 입니다! ',
                });
            }

            //참가할 스터디의 멤버들 찾기
            people = await STUDYMEMBERS.find({ studyId });

            //스터디에 참가한 멤버 수 만큼 돈다.
            for (let i = 0; i < people.length; i++) {
                //만약 로그인한 유저가 이미 해당 스터디에 있다면 취소로 받아들인다.
                if (people[i].studyMemberId === Number(userId)) {
                    if (study.studyMasterId === Number(userId)) {
                        /*=====================================================================================
                       #swagger.responses[403] = {
                           description: '스터디장이 스터디에서 나가려고 할 때 이 응답을 준다.',
                           schema: { "result": false, 'message':'스터디장은 나갈 수 없습니다.', }
                       }
                       =====================================================================================*/
                        return res.status(403).json({
                            result: false,
                            message: '스터디장은 나갈 수 없습니다.',
                        });
                    }

                    await STUDYMEMBERS.findOneAndDelete({
                        studyId: studyId,
                        studyMemberId: userId,
                    });

                    /*=====================================================================================
                   #swagger.responses[201] = {
                       description: '스터디 취소에 성공했을 때 이 응답을 준다.',
                       schema: { "result": true, 'message':'스터디 취소 성공', }
                   }
                   =====================================================================================*/
                    return res.status(201).json({
                        result: true,
                        message: '스터디 취소 성공!',
                    });
                }
            }
            if (
                study.studyLimitCnt === people.length ||
                study.studyLimitCnt < people.length
            ) {
                /*=====================================================================================
               #swagger.responses[403] = {
                   description: '정원이 초과했을 때 이 응답을 준다.',
                   schema: { "result": false, 'message':'정원초과라 해당 스터디에 참가할 수 없습니다.', }
               }
               =====================================================================================*/
                return res.status(403).json({
                    resutl: false,
                    message: '정원 초과라 해당 스터디에 참가할 수 없습니다!',
                });
            }

            if (study.studyMasterId === Number(userId)) {
                master = true;
            }

            await STUDYMEMBERS.create({
                studyMemberId: userId,
                studyId,
                isStudyMaster: master,
                regDate: getDate(),
            });

            /*=====================================================================================
           #swagger.responses[201] = {
               description: '스터디 참가에 성공했을 때 이 응답을 준다.',
               schema: { "result": true, 'message':'스터디 참가 성공', }
           }
           =====================================================================================*/
            return res.status(201).json({
                result: true,
                message: '스터디 참가 성공!',
            });
        } else {
            /*=====================================================================================
           #swagger.responses[403] = {
               description: '모임에 가입하지 않은 유저가 스터디에 참가하려고 할 때 이 응답을 줍니다.',
               schema: { "result": false, 'message':'해당 모임에 먼저 가입하고 스터디에 참가가능', }
           }
           =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '해당 모임에 먼저 가입하고 스터디에 참가가능',
            });
        }
    } catch (err) {
        console.log(err);
        /*=====================================================================================
           #swagger.responses[403] = {
               description: '모든 예외처리를 빗나간 에러는 이 응답을 줍니다.',
               schema: { "result": false, 'message':'스터디 참가 실패!', }
           }
           =====================================================================================*/
        return res.status(403).json({
            result: true,
            message: '스터디 참가 실패!',
        });
    }
}

//스터디 멤버 팝업 조회💡
/**===================================================================
 * 2022. 05. 17. HOJIN
 * TODO:
 * 1. 스터디 멤버 팝업 조회 
 * 2. 조회를 눌러 팝업이 뜨면, 스터디장과 로그인한 유저가 가장 위로 오게 된다. 
 * 3. 하지만 만약 로그인한 유저가 참가하지 않은 스터디의 멤버를 조회한다면
 * 4. 나는 포함되지 않고 스터디장만 맨 위로 나오게 된다. 
 ===================================================================*/

async function getStudyMembers(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 멤버 팝업 조회 API'
        #swagger.description = '스터디 멤버 팝업 조회 API'
    ========================================================================================================*/
    // const { userId } = req.query;//임시로 로그인한 유저로 친다.
    const { userId } = res.locals.user;
    const { studyId } = req.params;
    try {
        const validStudy = await STUDY.findOne({ studyId: Number(studyId) });
        if (!validStudy) {
            /*=====================================================================================
           #swagger.responses[403] = {
               description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
               schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
           }
           =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 스터디 입니다.',
            });
        }
        const validUser = await USER.findOne({ userId: Number(userId) });
        if (!validUser) {
            /*=====================================================================================
         #swagger.responses[403] = {
             description: '로그인한 유저가 유효하지 않은 유저일 때 이 응답이 갑니다.',
             schema: { "result": false, 'message':'유효하지 않은 유저입니다! ', }
         }
         =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다! ',
            });
        }

        let studyUsers = [];
        let myProfileData = {};
        let masterProfileData = {};
        let studyMasterProfile = {};
        let myProfile = {};
        let findUserData = {};
        let studyMyId;
        let studyMasterId;
        let studyMemberId;
        let isStudyMaster;

        //현재 조회한 스터디id에 참여한 유저들
        const data = await STUDYMEMBERS.find({ studyId: Number(studyId) });
        // console.log(`스터디 ${studyId}에 있는 스터디 멤버들`, data)
        //현재 스터디의 멤버 수만큼 반복 중
        for (let i = 0; i < data.length; i++) {
            let findUser = {};
            //로그인한 유저라면~
            //로그인한 유저가 본인이 참가하고 있는 스터디의 멤버 조회를 한다면
            //만약 로그인한 유저가 있다면 마이 프로필이 나오고
            //만약 참가하지 않은 스터디라면 본인 프로필은 나오지 않는다.
            //myprofile이 있다는 것은 로그인한 유저가 해당 스터디에 참가하고 있다는 뜻

            //방장이라면
            if (data[i].isStudyMaster) {
                studyMasterId = data[i].studyMemberId;
                isStudyMaster = data[i].isStudyMaster; //마스터 여부
                masterProfileData = await USER.findOne(
                    { userId: studyMasterId },
                    {
                        userId: true,
                        profileImage: true,
                        username: true,
                        _id: false,
                    }
                );

                //isStudyMaster를 포함시키기 위해 새롭게 객체를 정의해준다.
                studyMasterProfile.userId = masterProfileData.userId;
                studyMasterProfile.username = masterProfileData.username;
                studyMasterProfile.profileImage =
                    masterProfileData.profileImage;
                studyMasterProfile.isStudyMaster = isStudyMaster;
            }

            if (data[i].studyMemberId === Number(userId)) {
                studyMyId = data[i].studyMemberId;
                isStudyMaster = data[i].isStudyMaster; //마스터 여부
                myProfileData = await USER.findOne(
                    { userId: studyMyId },
                    {
                        userId: true,
                        profileImage: true,
                        username: true,
                        _id: false,
                    }
                );

                //isStudyMaster를 포함시키기 위해 새롭게 객체를 정의해준다.
                myProfile.userId = myProfileData.userId;
                myProfile.username = myProfileData.username;
                myProfile.profileImage = myProfileData.profileImage;
                myProfile.isStudyMaster = isStudyMaster;
            } else {
                // 참가한 유저들
                studyMemberId = data[i].studyMemberId;
                isStudyMaster = data[i].isStudyMaster;
                findUserData = await USER.findOne(
                    { userId: studyMemberId },
                    {
                        userId: true,
                        profileImage: true,
                        username: true,
                        _id: false,
                    }
                );
                //isStudyMaster를 포함시키기 위해 새롭게 객체를 정의해준다.
                findUser.userId = findUserData.userId;
                findUser.username = findUserData.username;
                findUser.profileImage = findUserData.profileImage;
                findUser.isStudyMaster = isStudyMaster;

                //스터디 마스터의 아이디랑 스터디 멤버가 같다면 굳이
                //스터디 멤버들 리스트에 넣어주지 않는다.
                if (findUser.userId !== masterProfileData.userId) {
                    studyUsers.push(findUser);
                }
            }
        }

        /*=====================================================================================
           #swagger.responses[200] = {
               description: '스터디 멤버를 조회하는 api ',
               schema: { "result": true, 스터디 멤버들 데이터
               (
                myProfile,
                studyMasterProfile,
                studyUsers
                )
           }
           =====================================================================================*/
        return res.status(200).json({
            result: true,
            myProfile,
            studyMasterProfile,
            studyUsers,
        });
    } catch (err) {
        console.log(err);

        /*=====================================================================================
           #swagger.responses[400] = {
               description: '모든 예외처리를 빗나간 에러는 이 응답을 줍니다.',
               schema: { "result": false, 'message':'스터디 멤버들 조회 실패', }
           }
           =====================================================================================*/
        return res.status(400).json({
            result: false,
            message: '스터디 멤버들 조회 실패!',
        });
    }
}

//스터디 참여인원 내보내기(강퇴)💡
/**===================================================================
 * 2022. 05. 17. HOJIN
 * TODO:
 * 1. 유저가 유효한지 체크
 * 2. 스터디가 유효한지 체크
 * 3. 모임이 유효한지 체크 
 * 4. 강퇴하려고 하는 유저가 해당 모임에 가입되어 있는 지 체크
 * 5. 강퇴는 모임장과 스터디장만 가능 
 * 
 ===================================================================*/
async function kickUser(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 강퇴 API'
        #swagger.description = '스터디 강퇴 API'
    ========================================================================================================*/
    const { userId } = res.locals.user;

    //targetId ==강퇴시킬 유저
    const { studyId, targetId, meetingId } = req.body;
    try {
        const validStudy = await STUDY.findOne({ studyId });
        if (!validStudy) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
                   schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 스터디 입니다.',
            });
        }
        const validUser = await USER.findOne({ userId });
        if (!validUser) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '스터디장, 모임장이 아닌 사람이 유저를 강퇴하려고 할 때 이 응답을 줍니다.',
                   schema: { "result": false, 'message': '유저 강퇴는 스터디장 또는 모임장만 가능합니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 유저입니다! ',
            });
        }
        let validMeeting = await MEETING.findOne({ meetingId });
        if (!validMeeting) {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '받은 모임id가 유효하지 않은 모임 id일 때 이 응답을 줍니다.',
                   schema: { "result": false, 'message': '유효하지 않은 모잉입니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '유효하지 않은 모임입니다.',
            });
        }
        let meetingMemberId = [];
        let meetingMembers = await MEETINGMEMBERS.find({ meetingId });
        let meetingMaster;
        for (let i = 0; i < meetingMembers.length; i++) {
            meetingMemberId.push(meetingMembers[i].meetingMemberId);
            if (meetingMembers[i].isMeetingMaster) {
                meetingMaster = meetingMembers[i].meetingMemberId;
            }
        }

        //삭제할 유저가 있는 모임 (모임장을 뽑기 위해)
        validMeeting = await MEETING.findOne({ meetingId });

        if (meetingMemberId.includes(Number(userId))) {
            // 모임안에 있는 스터디들 중에서 강퇴시킬 유저의 스터디 아이디
            targetStudy = await STUDY.findOne({ studyId });
            if (targetStudy) {
                //스터디자과 모임장만이 유저를 강퇴할 수 있다.
                if (
                    targetStudy.studyMasterId === Number(userId) ||
                    validMeeting.meetingMasterId === Number(userId)
                ) {
                    // 강퇴할 스터디 아이디에서 강퇴할 유저를 지워버린다.
                    await STUDYMEMBERS.findOneAndDelete({
                        studyId: targetStudy.studyId,
                        studyMemberId: targetId,
                    });
                    /*=====================================================================================
                       #swagger.responses[201] = {
                           description: '유저 강퇴를 성공할 경우 이 응답을 준다.',
                           schema: { "result": true, 'message': '유저 강퇴', }
                       }
                       =====================================================================================*/
                    return res.status(201).json({
                        result: true,
                        message: '유저 강퇴',
                    });
                } else {
                    /*=====================================================================================
                       #swagger.responses[403] = {
                           description: '스터디장, 모임장이 아닌 사람이 유저를 강퇴하려고 할 때 이 응답을 줍니다.',
                           schema: { "result": false, 'message': '유저 강퇴는 스터디장 또는 모임장만 가능합니다.', }
                       }
                       =====================================================================================*/
                    return res.status(403).json({
                        result: false,
                        message:
                            '유저 강퇴는 스터디장 또는 모임장만 가능합니다.',
                    });
                }
            }

            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '예외처리를 모두 빗난 간 에러가 발생 했을 때 이 응답을 줍니다.',
                   schema: { "result": false, 'message': '유저 강퇴 실패!, }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '입력하신 스터디가 존재하지 않습니다.',
            });
        } else {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '모임에 가입하지 않은 유저가 어떤 유저를 강퇴하려고 할 때 이 응답을 보냅니다.',
                   schema: { "result": false, 'message': '모임에 가입되지 않은 사용자입니다.', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '모임에 가입되지 않은 사용자입니다.',
            });
        }
    } catch (err) {
        console.log(err);

        /*=====================================================================================
           #swagger.responses[400] = {
               description: '예외처리를 모두 빗난 간 에러가 발생 했을 때 이 응답을 줍니다.',
               schema: { "result": false, 'message': '유저 강퇴 실패!, }
           }
           =====================================================================================*/
        return res.status(400).json({
            result: false,
            message: '유저 강퇴 실패!',
        });
    }
}

//스터디 삭제💡
/**===================================================================
 * 2022. 05. 17. HOJIN
 * TODO:
 * 1. 받은 스터디가 유효한지 체크
 * 2. 삭제하려고 하는 유저가 해당 모임에 가입되어 있는 지 체크
 * 3. 삭제는 스터디 장과 모임장만이 가능하다.
 * 4. 유저가 유효한지 체크
 * 5. 모임이 유효한지 체크
 * 6. 삭제하려는 스터디가 모임에 종속되어 있는 지 체크 
 ===================================================================*/
async function deleteStudy(req, res) {
    /*========================================================================================================
        #swagger.tags = ['STUDY']
        #swagger.summary = '스터디 삭제 API'
        #swagger.description = '스터디 삭제 API'
    ========================================================================================================*/

    const { userId } = res.locals.user;
    const { studyId, meetingId } = req.params;
    try {
        // const targetStudy = await STUDY.findOne({ studyId: Number(studyId) });
        // if (!targetStudy) {
        //     /*=====================================================================================
        //        #swagger.responses[403] = {
        //            description: '받은 스터디 id가 존재 하지 않을 때 이 응답이 갑니다.',
        //            schema: { "result": false, 'message':'해당 스터디가 존재하지 않습니다.', }
        //        }
        //        =====================================================================================*/
        //     return res.status(403).json({
        //         result: false,
        //         message: '해당 스터디가 존재하지 않습니다! ',
        //     });
        // }
        // const validMeeting = await MEETING.findOne({ meetingId: Number(meetingId) });
        // if (!validMeeting) {
        //     /*=====================================================================================
        //        #swagger.responses[403] = {
        //            description: '받은 모임 id가 유효하지 않을 때 이 응답이 갑니다.',
        //            schema: { "result": false, 'message':'해당 모임이 존재하지 않습니다.', }
        //        }
        //        =====================================================================================*/
        //     return res.status(403).json({
        //         result: false,
        //         message: '해당 모임이 존재하지 않습니다.',
        //     });
        // }
        // const validUser = await USER.findOne({ userId: Number(userId) });
        // if (!validUser) {
        //     /*=====================================================================================
        //        #swagger.responses[403] = {
        //            description: '로그인한 유저가 유효하지 않은 유저일 때 이 응답이 갑니다.',
        //            schema: { "result": false, 'message':'유효하지 않은 유저입니다! ', }
        //        }
        //        =====================================================================================*/
        //     return res.status(403).json({
        //         result: false,
        //         message: '유효하지 않은 유저입니다! ',
        //     });
        // }
        const deleteStudy = await STUDY.find({ meetingId: Number(meetingId) });
        let deleteStudyId = [];
        // for (let i = 0; i < deleteStudy.length; i++) {
        //     deleteStudyId.push(deleteStudy[i].studyId);
        // }
        // if (!deleteStudyId.includes(Number(studyId))) {
        //     /*=====================================================================================
        //        #swagger.responses[403] = {
        //            description: '식제하고자 하는 스터디가 해당 모임에 없을 때 이 응답이 넘어갑니다.',
        //            schema: { "result": false, 'message:'삭제하고자 하는 스터디는 현재 모임에 없습니다!', }
        //        }
        //        =====================================================================================*/
        //     return res.status(403).json({
        //         result: false,
        //         message: '삭제하고자 하는 스터디는 현재 모임에 없습니다! ',
        //     });
        // }
        let meetingMemberId = [];
        let meetingMembers = await MEETINGMEMBERS.find({ meetingId: Number(meetingId) });

        let meetingMaster;
        for (let i = 0; i < meetingMembers.length; i++) {
            meetingMemberId.push(meetingMembers[i].meetingMemberId);
            if (meetingMembers[i].isMeetingMaster) {
                meetingMaster = meetingMembers[i].meetingMemberId;
            }
        }

        if (meetingMemberId.includes(Number(userId))) {
            const targetStudyMember = await STUDYMEMBERS.find({ studyId: Number(studyId) });
            //스터디장과 모임장만이 스터디를 삭제할 수 있다.
            if (
                targetStudy.studyMasterId === Number(userId) ||
                meetingMaster === Number(userId)
            ) {
                await STUDY.deleteOne({ studyId: Number(studyId) });
                for (let i = 0; i < targetStudyMember.length; i++) {
                    await STUDYMEMBERS.findOneAndDelete({ studyId: Number(studyId) });
                }

                /*=====================================================================================
                   #swagger.responses[200] = {
                       description: '스터디 삭제가 성공했음을 응답으로 넘겨줍니다.',
                       schema: { "result": true, 'message:'스터디 삭제 성공', }
                   }
                   =====================================================================================*/
                return res.status(200).json({
                    result: true,
                    message: '스터디 삭제 성공!',
                });
            } else {
                /*=====================================================================================
                #swagger.responses[400] = {
                    description: '스터디장, 모임장이 아닌 사람이 삭제하려고 했을 때 이 응답이 갑니다',
                    schema: { "result": false, 'message': '스터디장 또는 모임장만 삭제 가능합니다.', }
                }
                =====================================================================================*/
                return res.status(400).json({
                    result: false,
                    message: '스터디장 또는 모임장만 삭제 가능합니다!',
                });
            }
        } else {
            /*=====================================================================================
               #swagger.responses[403] = {
                   description: '해당 모임에 가입하지 않은 사용자가 스터디를 삭제하고자 할 때 이 응답이 갑니다',
                   schema: { "result": false, 'message:'해당 모임에 먼저 가입하세요', }
               }
               =====================================================================================*/
            return res.status(403).json({
                result: false,
                message: '해당 모임에 먼저 가입하세요!',
            });
        }
    } catch (err) {
        console.log(err);
        /*=====================================================================================
           #swagger.responses[400] = {
               description: '모든 예외처리를 빗나간 에러가 발생했을 때 이 응답이 갑니다.',
               schema: { "result": false, 'message:'스터디 삭제 실패', }
           }
           =====================================================================================*/
        return res.status(400).json({
            result: false,
            message: '스터디 삭제 실패!',
        });
    }
}

module.exports = {
    postStudy,
    updateStudy,
    getStudyLists,
    inoutStudy,
    getStudyMembers,
    kickUser,
    deleteStudy,
};
