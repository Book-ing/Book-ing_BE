const STUDY = require('../schemas/studys');
const STUDYMEMBERS = require('../schemas/studyMembers');
const USER = require('../schemas/user');
const { getDate } = require('../lib/util');
const User = require('../schemas/user');

/**
/* 
    2022-05-02 HOJIN
    TODO 1. 
 */




//여기는 모임 안에 들어온 상태다
//스터디 목록 조회
async function getStudyLists(req, res) {
    const { meetingId } = req.params;
    const { userId } = req.query; //임시로 로그인한 유저라 판단

    /**===================================================================
  * 각 모임id별로 있는 스터디 존재 
  ===================================================================*/

    try {
        //해당 모임id 에 있는 전체 스터디 목록 찾기
        const data = await STUDY.find({ meetingId });
        const studyList = [];


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
            const studyNote = data[i].studyNote;
            const studyMasterProfile = data[i].studyMasterProfile;
            const regDate = data[i].regDate;



            //모임에 있는 각!! 스터디 아이디에 참여한 멤버들을 가지고 온다.
            people = await STUDYMEMBERS.find({ studyId });
            let studyUserCnt = 0;
            let isStudyJoined = false;


            //지금 로그인한 유저가 이 스터디에 참가 했는지 안했는지 판단
            for (let k = 0; k < people.length; k++) {
                if (people[k].studyMemberId === Number(userId)) {
                    isStudyJoined = true;
                }

            }

            const together = [];
            let isStudyMaster;

            /**===================================================================
          * 해당 스터디에 참가하고 있는 멤버들 조회 
          ===================================================================*/
            //각 스터디에 참여한 멤버들을 유저에서 찾아 유저 아이디와 프로필을 가져오기 위한 것
            //각 스터디에 참여한 멤버들이 마스터인지 아닌지 판단 여부 넣어줌 
            for (let j = 0; j < people.length; j++) {
                let joinedUser = await User.find({
                    userId: people[j].studyMemberId,
                });

                const userId = joinedUser[0].userId;
                const profileImage = joinedUser[0].profileImage;
                studyUserCnt = people.length;
                isStudyMaster = people[j].isStudyMaster

                together.push({
                    userId,
                    isStudyMaster,
                    profileImage,
                });
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
                studyNote,
                studyMasterProfile,
                regDate,
                together
            });
        }

        return res.status(200).json({ result: 'true', studyList, });
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            result: 'false',
            message: '스터디 목록 조회 실패!',
        });
    }
}

//스터디 등록
async function postStudy(req, res) {


    /**===================================================================
  * 어떤 모임안에 있는 스터디 등록하기
  ===================================================================*/
    // const studyMasterId = res.locals.user.userId

    let {
        meetingId,
        studyMasterId, //임시로 만듦
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
        studyNote,
    } = req.body;

    if (studyBookImg === '' || studyBookImg === null) {
        studyBookImg =
            'https://kuku-keke.com/wp-content/uploads/2020/05/2695_3.png';
    }

    /**===================================================================
  * 스터디를 만드는 사람이 방장이 된다.
  ===================================================================*/
    try {
        await STUDY.create({
            meetingId,
            studyMasterId,
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
            studyNote,
            regDate: getDate(),
        }).then(
            async (study) =>
                await STUDYMEMBERS.create({
                    studyMemberId: studyMasterId,
                    studyId: study.studyId,
                    isStudyMaster: true,
                    regDate: getDate(),
                })
        );

        return res.status(201).json({
            result: true,
            message: '스터디 등록 성공',
        });
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            result: 'false',
            message: '스터디 등록 실패!',
        });
    }
}

//스터디 정보 수정
/**===================================================================
* 스터디 정보 수정 
===================================================================*/
async function updateStudy(req, res) {
    const { userId } = req.query; //임시로 로그인한 유저 표시

    const {
        studyId,
        studyTitle,
        studyDateTime,
        studyAddr,
        studyAddrDetail,
        studyPrice,
        studyNotice,
        studyBookTitle,
        studyBookImg,
        studyBookInfo,
    } = req.body;

    //res.locals에서 유저 정보 가지고 와서 studyMasterId와 비교후
    // 맞는 지 비교하는 로직 필요
    //meetingId도 받아와야 하나?
    // const userId = res.locals.userId
    const updateStudy = await STUDY.findOne({ studyId })


    /**===================================================================
  * 스터디 정보를 수정할 수 있는 사람은 스터디 장과 모임장 뿐이다.
  ===================================================================*/
    if (updateStudy.studyMasterId === Number(userId)) {
        try {
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
                    },
                }
            );
            return res
                .status(201)
                .json({ result: 'true', message: '스터디 정보 수정 완료!' });
        } catch (err) {
            console.log(err);
            res.status(400).json({
                result: 'false',
                message: '스터디를 수정할 수 없습니다!',
            });
        }

    } else {
        return res.status(400).json({ result: 'false', message: '스터디 정보 수정은 스터디 장 또는 모임장만 가능합니다.' })
    }
}

//스터디 참가 및 취소
//우선은 type으로 받는 로직

/**===================================================================
* 스터디 참가하기
===================================================================*/
async function joinStudy(req, res) {
    const { userId, studyId, studyType } = req.body;

    if (studyType === 'join') {
        try {
            let master = false;
            let study = await STUDY.findOne({ studyId });
            people = await STUDYMEMBERS.find({ studyId });
            for (let i = 0; i < people.length; i++) {
                if (people[i].studyMemberId === Number(userId)) {
                    return res.status(400).json({
                        result: 'false',
                        message: '이미 해당 스터디에 참가하셨습니다!'
                    })
                }
            }
            if (study.studyLimitCnt === people.length || study.studyLimitCnt < people.length) {
                return res.status(400).json({
                    resutl: 'false',
                    message: '정원 초과라 해당 스터디에 참가할 수 없습니다!'
                })
            }

            if (study.masterId === userId) {
                master = true;
            }
            await STUDYMEMBERS.create({
                studyMemberId: userId,
                studyId,
                isStudyMaster: master,
                regDate: getDate(),
            });

            return res.status(200).json({
                result: 'true',
                message: '스터디 참가 성공!',
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                result: 'false',
                message: '스터디 참가 실패!',
            });
        }
    } else if (studyType === 'quit') {

        /**===================================================================
      * 스터디 취소하기, 다만 다른 멤버들이 있을 때 스터디장은 나갈 수 없고 스터디 장이 나다면
      * 해당 스터디는 삭제된다.
      ===================================================================*/
        try {
            //해당 스터디들만 가져옴
            let study = await STUDY.findOne({ studyId });
            //해당 스터디에 참가한 멤버들 
            people = await STUDYMEMBERS.find({ studyId });
            // console.log(`${studyId}번 스터디에 참가한 멤버들 `, people)

            //스터디 멤버가 2명 이상일 때 스터디 장은 나갈 수가 없다. 

            if (people.length > 1) {
                if (study.studyMasterId === userId) {
                    return res.status(400).json({
                        result: 'false',
                        message: '스터디장은 나갈 수 없습니다.',
                    });
                }
                //취소할 스터디의 멤버 중에서 로그인한 유저랑 일치하는 멤버를 삭제
                await STUDYMEMBERS.findOneAndDelete({ studyId: studyId, studyMemberId: userId },)

                return res.status(200).json({
                    result: 'true',
                    message: '스터디 취소 성공!',
                });

                //하지만 스터디에 스터디 장만 남아있을 때 스터디 장이 나가면 스터디는 삭제가 가능하다.
            } else if (people.length === 1) {
                await STUDYMEMBERS.deleteOne({ studyMemberId: userId })
                await STUDY.deleteOne({ studyId })
                return res.status(200).json({
                    result: 'true',
                    message: '스터디 삭제 성공!'
                })
            }
        } catch (err) {
            return res.status(400).json({
                result: 'false',
                message: '스터디 취소 실패!',
            });
        }
    }
}

//스터디 멤버 팝업 조회
/**===================================================================
 * 스터디 멤버 팝업 조회 
 * 조회를 눌러 팝업이 뜨면, 스터디장과 로그인한 유저가 가장 위로 오게 된다. 
 * 하지만 만약 로그인한 유저가 참가하지 않은 스터디의 멤버를 조회한다면
 * 나는 포함되지 않고 스터디장만 맨 위로 나오게 된다. 
 ===================================================================*/

async function getStudyMembers(req, res) {
    const { studyId } = req.params;
    const { userId } = req.query;//임시로 로그인한 유저로 친다.

    try {

        //내 프로필
        let studyMasterId;
        let studyMyId;
        let studyMasterProfile;
        const studyUsers = [];
        let studyMemberId;
        let findUser

        let myProfile;
        //현재 조회한 스터디id에 참여한 유저들
        const data = await STUDYMEMBERS.find({ studyId },);
        console.log(`스터디 ${studyId}에 있는 스터디 멤버들`, data)

        //현재 스터디의 멤버 수만큼 반복 중 
        for (let i = 0; i < data.length; i++) {
            //방장이라면
            if (data[i].isStudyMaster) {
                studyMasterId = data[i].studyMemberId;
                studyMasterProfile = await USER.findOne({ userId: studyMasterId }, ['userId', 'profileImage', 'username'])
            }

            //로그인한 유저가 본인이 참가하고 있는 스터디의 멤버 조회를 한다면
            //만약 로그인한 유저가 있다면 마이 프로필이 나오고
            //만약 참가하지 않은 스터디라면 본인 프로필은 나오지 않는다. 
            //myprofile이 있다는 것은 로그인한 유저가 해당 스터디에 참가하고 있다는 뜻
            if (data[i].studyMemberId === Number(userId)) {
                studyMyId = data[i].studyMemberId;
                myProfile = await USER.findOne({ userId: studyMyId }, ['userId', 'profileImage', 'username'])
            }
            studyMemberId = data[i].studyMemberId

            findUser = await USER.findOne({ userId: studyMemberId }, ['userId', 'profileImage', 'username'])

            //스터디 마스터의 아이디랑 스터디 멤버가 같다면 굳이
            //스터디 멤버들에 넣어주지 않는다.
            if (findUser.userId !== studyMasterProfile.userId) {
                studyUsers.push(findUser)
            }

        }

        return res.status(200).json({
            result: "true",
            myProfile,
            studyMasterProfile,
            studyUsers

        })
    } catch (err) {
        console.log(err)
        return res.status(400).json({
            result: 'false',
            message: '스터디 멤버들 조회 실패!'
        })
    }

}

module.exports = { postStudy, updateStudy, getStudyLists, joinStudy, getStudyMembers };
