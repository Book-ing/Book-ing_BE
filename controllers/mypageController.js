const lib = require('../lib/util');

const USER = require('../schemas/user');

/**
 * TODO:
 *  1. 
 * FIXME:
 *  1. 
 */
async function getSelectMyProfile(req, res){
    const { userId } = req.params;
    // let responseData = {};

    const myProfile = await USER.find(
        { userId: userId },
        {
            _id: false,
            userId: true,
            profileImage: true,
            statusMessage: true
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
        data: myProfile
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
async function putUpdateMyIntro(req, res){
    const {userId, statusMessage} = req.body;

    const updateResult = await USER.updateOne(
        { userId: userId}, { 
            $set: { 
                statusMessage: statusMessage 
            }
        } 
    );
    if(!updateResult) res.status(400).json({ result: false, message: '마이페이지 프로필 수정 실패' });

    res.status(201).json({ result: true, message: '마이페이지 프로필 수정 성공' });
}

/**
 * TODO:
 *  1. 
 * FIXME:
 *  1. 
 */
async function getSelectMyMeeting(req, res){
    res.send('내가 만든 모임 조회 API 구현예정');
}

/**
 * TODO:
 *  1. 
 * FIXME:
 *  1. 
 */
async function getSelectJoinedMeeting(req, res){
    res.send('내가 가입된 모임 조회 API 구현예정');
}

/**
 * TODO:
 *  1. 
 * FIXME:
 *  1. 
 */
async function getSelectMyStudy(req, res){
    res.send('내가 만든 스터디 조회 API 구현예정');
}

/**
 * TODO:
 *  1. 
 * FIXME:
 *  1. 
 */
async function getSelectJoinedStudy(req, res){
    res.send('내가 참여한 스터디 조회 API 구현예정');
}

module.exports = {
    getSelectMyProfile,
    putUpdateMyIntro,
    getSelectMyMeeting,
    getSelectJoinedMeeting,
    getSelectMyStudy,
    getSelectJoinedStudy
};