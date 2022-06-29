const USER = require('../schemas/user');
const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');
const STUDYMEMBER = require('../schemas/studyMembers');
const BANNEDUSER = require('../schemas/bannedUsers');
const CHAT = require('../schemas/chats');
const CODE = require('../schemas/codes');
const lib = require('../lib/util');
const { deleteImage } = require('../middlewares/multer');

async function createMeeting(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 생성 API'
    const { userId } = res.locals.user;
    const {
        meetingName,
        meetingCategory,
        meetingLocation,
        meetingIntro,
        meetingLimitCnt,
    } = req.body;

    try {
        const existMaster = await MEETING.findOne({ meetingMasterId: userId });
        if (existMaster) {
            if (req.file) deleteImage(req.file.location);
            /*
             #swagger.responses[400] = { description: '이미 생성한 모임이 있을 때 이 응답이 갑니다.',
             schema: { 'result': false, 'message': '이미 생성한 모임이 있습니다.', } }
             */
            return next(new Error('이미 생성한 모임이 있습니다.'));
        }


        const meetingImage = req.file?.location ?? 'https://cdn.pixabay.com/photo/2016/03/27/19/32/book-1283865_960_720.jpg';

        const categoryCode = await CODE.findOne({ codeValue: meetingCategory });
        const locationCode = await CODE.findOne({ codeValue: meetingLocation });

        if (!categoryCode) {
            /*
             #swagger.responses[400] = { description: '코드 테이블에 카테고리 값이 없거나 잘못될 때 이 응답이 갑니다.',
             schema: { 'result': false, 'message': '모임 카테고리 입력 오류', } }
            */
            return next(new Error('모임 카테고리 입력 오류'));
        } else if (!locationCode) {
            /*
             #swagger.responses[400] = { description: '코드 테이블에 지역 값이 없거나 잘못될 때 이 응답이 갑니다.',
             schema: { 'result': false, 'message': '모임 지역 입력 오류', } }
            */
            return next(new Error('모임 지역 입력 오류'));
        }

        await MEETING.create({
            meetingMasterId: userId,
            meetingName,
            meetingCategory: categoryCode.codeId,
            meetingLocation: locationCode.codeId,
            meetingImage,
            meetingIntro,
            meetingLimitCnt,
            regDate: lib.getDate(),
        }).then(
            async (result) =>
                await MEETINGMEMBER.create({
                    meetingMemberId: userId,
                    meetingId: result.meetingId,
                    isMeetingMaster: true,
                    regDate: lib.getDate(),
                }),
        );

        /*
         #swagger.responses[201] = { description: '모임 생성이 성공했을 때 이 응답이 갑니다.',
         schema: { 'result': true, 'message': '모임 생성 성공', } }
        */
        res.status(201).json({ result: true, message: '모임 생성 성공' });
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 생성 실패', } }
        */
        return next({ message: '모임 생성 실패', stack: error, code: 500 });
    }
}

async function getMeetingInfo(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 페이지 모임 정보 API'
    const { meetingId } = req.params;

    try {
        let isMeetingJoined = false;

        if (res.locals.user) {
            const { userId } = res.locals.user;
            const existMeetingMember = await MEETINGMEMBER.findOne({
                meetingMemberId: userId,
                meetingId,
            });
            if (existMeetingMember) isMeetingJoined = true;
        }

        // 모임 정보
        const meetingInfo = await MEETING.findOne({ meetingId });
        const meetingCategory = await CODE.findOne({
            codeId: meetingInfo.meetingCategory,
        });
        const meetingLocation = await CODE.findOne({
            codeId: meetingInfo.meetingLocation,
        });
        const meetingStudyCnt = await STUDY.find({ meetingId }).count();

        // 모임 마스터의 프로필 정보
        const meetingMasterProfile = await USER.findOne({
            userId: meetingInfo.meetingMasterId,
        });
        // 모임에 가입된 유저들
        const meetingUserList = await MEETINGMEMBER.find({ meetingId, isMeetingMaster: false });
        // 모임에 가입된 유저들 고유 id
        const meetingUsersId = meetingUserList.map(
            (result) => result.meetingMemberId,
        );
        // 모임에 가입된 유저들 정보
        const meetingUsersProfile = await USER.find(
            { userId: meetingUsersId },
            {
                userId: true,
                username: true,
                profileImage: true,
                statusMessage: true,
                _id: false,
            },
        ).limit(3);

        const meetingUsersProfileArr = [];
        for (let i = 0; i < meetingUsersProfile.length; i++) {
            const userId = meetingUsersProfile[i].userId;
            const username = meetingUsersProfile[i].username;
            const profileImage = meetingUsersProfile[i].profileImage;
            const statusMessage = meetingUsersProfile[i].statusMessage;

            let isMeetingMaster = false;
            if (userId === meetingInfo.meetingMasterId) {
                isMeetingMaster = true;
            }
            meetingUsersProfileArr.push({
                userId,
                username,
                profileImage,
                statusMessage,
                isMeetingMaster,
            });
        }
        /*
         #swagger.responses[200] = { description: '모임 정보 조회가 성공했을 때 이 응답이 갑니다.',
         schema: { 'result': true, 'message': '모임 페이지 모임정보 조회 성공', } }
        */
        res.status(200).json({
            result: true,
            message: '모임 페이지 모임정보 조회 성공',
            data: {
                meetingId: meetingInfo.meetingId,
                meetingName: meetingInfo.meetingName,
                meetingCategory: meetingCategory.codeValue,
                meetingLocation: meetingLocation.codeValue,
                meetingImage: meetingInfo.meetingImage,
                meetingIntro: meetingInfo.meetingIntro,
                meetingUserCnt: meetingUserList.length + 1,
                meetingLimitCnt: meetingInfo.meetingLimitCnt,
                meetingStudyCnt,
                isMeetingJoined,
                meetingMasterProfile: {
                    userId: meetingMasterProfile.userId,
                    nickname: meetingMasterProfile.username,
                    profileImage: meetingMasterProfile.profileImage,
                    statusMessage: meetingMasterProfile.statusMessage,
                    isMeetingMaster: true,
                },
                together: meetingUsersProfileArr,
            },
        });
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 페이지 모임정보 조회 실패', } }
        */
        return next({ message: '모임 페이지 모임정보 조회 실패', stack: error, code: 500 });
    }
}

async function getMeetingUsers(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 페이지 함께하는 사람들 팝업 조회 API'
    const { meetingId } = req.params;
    const { userId } = res.locals.user;

    try {
        let isMeetingMaster = false;
        let isMeetingJoined = false;
        const existMeetingMember = await MEETINGMEMBER.findOne({
            meetingMemberId: userId,
            meetingId,
        });
        /*
         #swagger.responses[400] = { description: '모임 가입유저가 아닌 사람이 조회했을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 가입 유저만 조회가 가능합니다.', } }
        */
        if (!existMeetingMember)
            return next(new Error('모임 가입 유저만 조회가 가능합니다.'));

        const myProfile = await USER.findOne(
            { userId },
            {
                userId: true,
                username: true,
                profileImage: true,
                statusMessage: true,
                _id: false,
            },
        );
        // 모임 정보
        const meetingInfo = await MEETING.findOne({ meetingId });
        // 모임 마스터의 프로필 정보
        const meetingMasterProfile = await USER.findOne({
            userId: meetingInfo.meetingMasterId,
        });

        const meetingUsers = await MEETINGMEMBER.find({ meetingId });
        const meetingUsersId = meetingUsers.map(
            (result) => result.meetingMemberId,
        );
        const meetingUsersProfile = await USER.find(
            { userId: meetingUsersId },
            {
                userId: true,
                username: true,
                profileImage: true,
                statusMessage: true,
                _id: false,
            },
        );

        if (existMeetingMember) isMeetingJoined = true;
        if (userId === meetingInfo.meetingMasterId) {
            isMeetingMaster = true;
        }

        const meetingUsersProfileArr = [];
        for (let i = 0; i < meetingUsersProfile.length; i++) {
            const userId = meetingUsersProfile[i].userId;
            const username = meetingUsersProfile[i].username;
            const profileImage = meetingUsersProfile[i].profileImage;
            const statusMessage = meetingUsersProfile[i].statusMessage;

            // isMeetingMaster = false;
            if (userId === meetingInfo.meetingMasterId) {
                isMeetingMaster = true;
            }
            meetingUsersProfileArr.push({
                userId,
                username,
                profileImage,
                statusMessage,
                isMeetingJoined: true,
                isMeetingMaster,
            });
        }

        /*
         #swagger.responses[200] = { description: '모임 가입 유저 조회가 성공했을 때 이 응답이 갑니다.',
         schema: { 'result': true, 'message': '모임 가입 유저 조회 성공', } }
        */
        res.status(200).json({
            result: true,
            message: '모임 가입 유저 조회 성공',
            data: {
                myProfile: {
                    userId: myProfile.userId,
                    username: myProfile.username,
                    profileImage: myProfile.profileImage,
                    statusMessage: myProfile.statusMessage,
                    isMeetingJoined,
                    isMeetingMaster,
                },
                meetingMasterProfile: {
                    userId: meetingMasterProfile.userId,
                    username: meetingMasterProfile.username,
                    profileImage: meetingMasterProfile.profileImage,
                    statusMessage: meetingMasterProfile.statusMessage,
                    isMeetingJoined: true,
                    isMeetingMaster: true,
                },
                meetingUsers: meetingUsersProfileArr,
            },
        });
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 가입 유저 조회 실패', } }
        */
        return next({ message: '모임 가입 유저 조회 실패', stack: error, code: 500 });
    }
}

async function inoutMeeting(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 페이지 모임 가입/탈퇴 API'
    const { meetingId } = req.body;
    const { userId } = res.locals.user;

    try {
        const existMeetingMember = await MEETINGMEMBER.findOne({
            meetingMemberId: userId,
            meetingId,
        });

        const meeting = await MEETING.findOne({ meetingId });
        /*
         #swagger.responses[400] = { description: '모임 마스터가 모임에 가입 혹은 탈퇴를 시도할 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 마스터는 모임 참여, 탈퇴가 불가능합니다.', } }
        */
        if (userId === meeting.meetingMasterId)
            return next(new Error('모임 마스터는 모임 참여, 탈퇴가 불가능합니다.'));

        const bannedMeetingUser = await BANNEDUSER.findOne({
            meetingId,
            userId,
        });

        /*
         #swagger.responses[400] = { description: '강퇴당한 유저가 해당 모임에 가입을 시도할 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '강퇴당한 유저는 모임 참여가 불가능합니다.', } }
        */
        if (bannedMeetingUser)
            return next(new Error('강퇴당한 유저는 모임 참여가 불가능합니다.'));

        if (!existMeetingMember) {
            const meetingMember = await MEETINGMEMBER.find({ meetingId });
            /*
             #swagger.responses[400] = { description: '모임 제한 인원수가 가득차고 가입을 시도했을 때 이 응답이 갑니다.',
             schema: { 'result': false, 'message': '모임 제한 인원 수가 찼습니다.', } }
            */
            if (meetingMember.length >= meeting.meetingLimitCnt)
                return next(new Error('모임 제한 인원 수가 찼습니다.'));

            await MEETINGMEMBER.create({
                meetingMemberId: userId,
                meetingId,
                regDate: lib.getDate(),
            });
            /*
             #swagger.responses[201] = { description: '모임 가입에 성공했을 때 이 응답이 갑니다.',
             schema: { 'result': true, 'message': '모임 가입 성공', } }
            */
            res.status(201).json({ result: true, message: '모임 가입 성공' });
        } else {
            const memberStudys = await STUDYMEMBER.find({
                studyMemberId: userId,
            });
            const joinedStudyId = memberStudys.map((result) => result.studyId);
            const joinedStudys = await STUDY.find({ studyId: joinedStudyId, meetingId });
            for (let i = 0; i < joinedStudys.length; i++) {
                if (
                    // 스터디가 완료되지 않고 강퇴당하는 유저가 스터디 마스터면 스터디와 스터디원 전부를 스터디에서 삭제시킨다.
                    lib.getDate() < joinedStudys[i].studyDateTime &&
                    userId === joinedStudys[i].studyMasterId
                ) {
                    await STUDY.deleteOne({ studyId: joinedStudys[i].studyId });
                    await STUDYMEMBER.deleteMany({
                        studyId: joinedStudys[i].studyId,
                    });
                } else if (
                    // 스터디가 완료되지 않고 강퇴당하는 유저가 스터디 마스터가 아니면 해당 스터디에서 강퇴유저를 제외시킨다.
                    lib.getDate() < joinedStudys[i].studyDateTime &&
                    userId !== joinedStudys[i].studyMasterId
                ) {
                    await STUDYMEMBER.deleteOne({
                        studyId: joinedStudys[i].studyId,
                        studyMemberId: userId,
                    });
                }
            }
            await MEETINGMEMBER.deleteOne({
                meetingMemberId: userId,
                meetingId,
            });
            /*
             #swagger.responses[201] = { description: '모임 탈퇴에 성공했을 때 이 응답이 갑니다.',
             schema: { 'result': true, 'message': '모임 탈퇴 성공', } }
            */
            res.status(201).json({ result: true, message: '모임 탈퇴 성공' });
        }
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 가입/탈퇴 실패', } }
        */
        return next({ message: '모임 가입/탈퇴 실패', stack: error, code: 500 });
    }
}

async function kickMeetingMember(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 페이지 함께 하는 사람들 내보내기(강퇴) API'
    const { targetId, meetingId } = req.body; // targetId: 강퇴를 당하는 사람의 Id (밴 당하는 유저)
    const { userId } = res.locals.user; // 강퇴를 하는 사람의 Id (모임 마스터)

    try {
        const meeting = await MEETING.findOne({ meetingId });
        /*
         #swagger.responses[400] = { description: '모임 마스터가 아닌 유저가 내보내기를 시도할 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 마스터만 내보내기가 가능합니다.', } }
        */
        if (userId !== meeting.meetingMasterId)
            return next(new Error('모임 마스터만 내보내기가 가능합니다.'));

        /*
         #swagger.responses[400] = { description: '모임 마스터를 내보내기 시도할 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 마스터는 내보내기가 불가능합니다.', } }
        */
        if (targetId === meeting.meetingMasterId)
            return next(new Error('모임 마스터는 내보내기가 불가능합니다.'));

        const kickMeetingMember = await MEETINGMEMBER.deleteOne({
            meetingId,
            meetingMemberId: targetId,
            isMeetingMaster: false,
        });

        if (kickMeetingMember.deletedCount) {
            const memberStudys = await STUDYMEMBER.find({
                studyMemberId: targetId,
            });
            const joinedStudyId = memberStudys.map((result) => result.studyId);
            const joinedStudys = await STUDY.find({ studyId: joinedStudyId, meetingId });
            for (let i = 0; i < joinedStudys.length; i++) {
                if (
                    // 스터디가 완료되지 않고 강퇴당하는 유저가 스터디 마스터면 스터디와 스터디원 전부를 스터디에서 삭제시킨다.
                    lib.getDate() < joinedStudys[i].studyDateTime &&
                    targetId === joinedStudys[i].studyMasterId
                ) {
                    await STUDY.deleteOne({ studyId: joinedStudys[i].studyId });
                    await STUDYMEMBER.deleteMany({
                        studyId: joinedStudys[i].studyId,
                    });
                } else if (
                    // 스터디가 완료되지 않고 강퇴당하는 유저가 스터디 마스터가 아니면 해당 스터디에서 강퇴유저를 제외시킨다.
                    lib.getDate() < joinedStudys[i].studyDateTime &&
                    targetId !== joinedStudys[i].studyMasterId
                ) {
                    await STUDYMEMBER.deleteOne({
                        studyId: joinedStudys[i].studyId,
                        studyMemberId: targetId,
                    });
                }
            }
            await BANNEDUSER.create({
                meetingId,
                userId: targetId,
                regDate: lib.getDate(),
            });
        }

        /*
         #swagger.responses[201] = { description: '모임 유저 내보내기에 성공했을 때 이 응답이 갑니다.',
         schema: { 'result': true, 'message': '모임 유저 내보내기 성공', } }
        */
        res.status(201).json({ result: true, message: '모임 유저 내보내기 성공' });
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 유저 내보내기 실패', } }
        */
        return next({ message: '모임 유저 내보내기 실패', stack: error, code: 500 });
    }
}

async function modifyMeeting(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 정보 수정 API'
    const {
        meetingId,
        meetingCategory,
        meetingLocation,
        meetingIntro,
    } = req.body;
    const { userId } = res.locals.user;

    try {
        const meeting = await MEETING.findOne({ meetingId });
        /*
         #swagger.responses[400] = { description: '모임 마스터가 아닌 유저가 모임 정보 수정을 시도할 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 마스터만 모임 정보 수정이 가능합니다.', } }
        */
        if (userId !== meeting.meetingMasterId)
            return next(new Error('모임 마스터만 모임 정보 수정이 가능합니다.'));


        const categoryCode = await CODE.findOne({ codeValue: meetingCategory });
        const locationCode = await CODE.findOne({ codeValue: meetingLocation });

        if (!categoryCode) {
            /*
             #swagger.responses[400] = { description: '코드 테이블에 카테고리 값이 없거나 잘못될 때 이 응답이 갑니다.',
             schema: { 'result': false, 'message': '모임 카테고리 입력 오류', } }
            */
            return next(new Error('모임 카테고리 입력 오류'));
        } else if (!locationCode) {
            /*
             #swagger.responses[400] = { description: '코드 테이블에 지역 값이 없거나 잘못될 때 이 응답이 갑니다.',
             schema: { 'result': false, 'message': '모임 지역 입력 오류', } }
            */
            return next(new Error('모임 지역 입력 오류'));
        }

        if (req.file) {
            const meetingImage = req.file.location;
            deleteImage(meeting.meetingImage);
            await MEETING.updateOne(
                { meetingId, meetingMasterId: userId },
                {
                    $set: {
                        meetingCategory: categoryCode.codeId,
                        meetingLocation: locationCode.codeId,
                        meetingIntro,
                        meetingImage,
                    },
                },
            );
        } else {
            await MEETING.updateOne(
                { meetingId, meetingMasterId: userId },
                {
                    $set: {
                        meetingCategory: categoryCode.codeId,
                        meetingLocation: locationCode.codeId,
                        meetingIntro,
                    },
                },
            );
        }

        /*
         #swagger.responses[201] = { description: '모임 정보 수정에 성공했을 때 이 응답이 갑니다.',
         schema: { 'result': true, 'message': '모임 정보 수정 성공', } }
        */
        res.status(201).json({ result: true, message: '모임 정보 수정 성공' });
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 정보 수정 실패', } }
        */
        return next({ message: '모임 정보 수정 실패', stack: error, code: 500 });
    }
}

async function deleteMeeting(req, res, next) {
    // #swagger.tags = ['MEETING']
    // #swagger.summary = '모임 삭제 API'
    const { meetingId } = req.params;
    const { userId } = res.locals.user;

    try {
        const meeting = await MEETING.findOne({ meetingId });
        /*
         #swagger.responses[400] = { description: '모임 마스터가 아닌 유저가 모임 삭제를 시도할 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 마스터만 모임 삭제가 가능합니다.', } }
        */
        if (userId !== meeting.meetingMasterId)
            return next(new Error('모임 마스터만 모임 삭제가 가능합니다.'));


        await MEETING.deleteOne({ meetingId, meetingMasterId: userId });
        await MEETINGMEMBER.deleteMany({ meetingId });
        const studyId = await STUDY.find({ meetingId }).then((value) =>
            value.map((result) => result.studyId),
        );
        await STUDYMEMBER.deleteMany({ studyId });
        await STUDY.deleteMany({ meetingId });
        await BANNEDUSER.deleteMany({ meetingId });
        await CHAT.deleteMany({ meetingId });
        deleteImage(meeting.meetingImage);

        /*
         #swagger.responses[201] = { description: '모임 삭제에 성공했을 때 이 응답이 갑니다.',
         schema: { 'result': true, 'message': '모임 삭제 성공', } }
        */
        res.status(201).json({ result: true, message: '모임 삭제 성공' });
    } catch (error) {
        /*
         #swagger.responses[500] = { description: '서버측에서 오류가 났을 때 이 응답이 갑니다.',
         schema: { 'result': false, 'message': '모임 삭제 실패', } }
        */
        return next({ message: '모임 삭제 실패', stack: error, code: 500 });
    }
}

module.exports = {
    createMeeting,
    getMeetingInfo,
    getMeetingUsers,
    inoutMeeting,
    kickMeetingMember,
    modifyMeeting,
    deleteMeeting,
};
