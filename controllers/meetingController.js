const USER = require('../schemas/user');
const MEETING = require('../schemas/meeting');
const MEETINGMEMBER = require('../schemas/meetingMember');
const STUDY = require('../schemas/studys');
const STUDYMEMBER = require('../schemas/studyMembers');
const BANNEDUSER = require('../schemas/bannedUsers');
const lib = require('../lib/util');

/**
 *     TODO 1. cookie에 유저 정보가 담기면 db에서 유저 검사 후 meetingMasterId 값으로 지정
 *          2. 모임은 한 사람당 하나만 만들 수 있기 때문에 만드려는 유저가 이미 만든 모임이 있는지 확인
 *          3. 기본 모임 이미지 협의 볼 것. url 형식이 아닐 수 있음.
 *          4. 카테고리, 지역 올바른 값인지 확인
 */
async function createMeeting(req, res) {
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query;
    const {
        meetingName,
        meetingCategory,
        meetingLocation,
        meetingIntro,
        meetingLimitCnt,
    } = req.body;

    const existMaster = await MEETING.find({ meetingMasterId: userId });
    if (existMaster.length) {
        return res
            .status(400)
            .json({ result: false, message: '이미 생성한 모임이 있습니다.' });
    }

    let meetingImage = '';
    if (req.file) {
        meetingImage = req.file.location;
    } else {
        meetingImage = 'https://img.lovepik.com/element/40135/2302.png_300.png';
    }

    await MEETING.create({
        meetingMasterId: userId,
        meetingName,
        meetingCategory,
        meetingLocation,
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
            })
    );

    res.status(201).json({ result: true, message: '모임 생성 성공' });
}

async function getMeetingInfo(req, res) {
    const { meetingId } = req.params;
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query;

    let isMeetingJoined = false;
    const existMeetingMember = await MEETINGMEMBER.findOne({
        meetingMemberId: userId, meetingId
    });
    if (existMeetingMember) isMeetingJoined = true;

    // 모임 정보
    const meetingInfo = await MEETING.findOne({ meetingId });
    // 모임 마스터의 프로필 정보
    const meetingMasterProfile = await USER.findOne({
        userId: meetingInfo.meetingMasterId,
    });
    // 모임에 가입된 유저들
    const meetingUserList = await MEETINGMEMBER.find({ meetingId });
    // 모임에 가입된 유저들 고유 id
    const meetingUsersId = meetingUserList.map(
        (result) => result.meetingMemberId
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
        }
    ).limit(4);

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
    res.status(200).json({
        result: true,
        message: '모임 페이지 모임정보 조회 성공',
        data: {
            meetingId: meetingInfo.meetingId,
            meetingName: meetingInfo.meetingName,
            meetingCategory: meetingInfo.meetingCategory,
            meetingLocation: meetingInfo.meetingLocation,
            meetingImage: meetingInfo.meetingImage,
            meetingIntro: meetingInfo.meetingIntro,
            meetingUserCnt: meetingUserList.length,
            meetingLimitCnt: meetingInfo.meetingLimitCnt,
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
}

async function getMeetingUsers(req, res) {
    const { meetingId } = req.params;
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query;

    const myProfile = await USER.findOne(
        { userId },
        {
            userId: true,
            username: true,
            profileImage: true,
            statusMessage: true,
            _id: false,
        }
    );
    // 모임 정보
    const meetingInfo = await MEETING.findOne({ meetingId });
    // 모임 마스터의 프로필 정보
    const meetingMasterProfile = await USER.findOne({
        userId: meetingInfo.meetingMasterId,
    });

    const meetingUsers = await MEETINGMEMBER.find({ meetingId });
    const meetingUsersId = meetingUsers.map((result) => result.meetingMemberId);
    const meetingUsersProfile = await USER.find(
        { userId: meetingUsersId },
        {
            userId: true,
            username: true,
            profileImage: true,
            statusMessage: true,
            _id: false,
        }
    );

    let isMeetingMaster = false;
    let isMeetingJoined = false;
    const existMeetingMember = await MEETINGMEMBER.findOne({
        meetingMemberId: userId,
    });
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

        isMeetingMaster = false;
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
}

async function inoutMeeting(req, res) {
    const { meetingId } = req.body;
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query;

    const existMeetingMember = await MEETINGMEMBER.findOne({
        meetingMemberId: userId,
        meetingId,
    });

    const meeting = await MEETING.findOne({ meetingId });
    // FIXME res.locals가 작업되면 넘어오는 값이 int인지 아닌지 확인 후 수정
    if (parseInt(userId) === meeting.meetingMasterId) {
        return res.status(400).json({
            result: false,
            message: '모임 마스터는 모임 참여, 탈퇴가 불가능합니다.',
        });
    }

    const bannedMeetingUser = await BANNEDUSER.findOne({ meetingId, userId });
    if (bannedMeetingUser) {
        return res.status(400).json({
            result: false,
            message: '강퇴당한 유저는 모임 참여가 불가능합니다.',
        });
    }

    if (!existMeetingMember) {
        const meetingMember = await MEETINGMEMBER.find({ meetingId });
        if (meetingMember.length >= meeting.meetingLimitCnt) {
            return res.status(400).json({
                result: false,
                message: '모임 제한 인원 수가 찼습니다.',
            });
        }
        await MEETINGMEMBER.create({
            meetingMemberId: userId,
            meetingId,
            regDate: lib.getDate(),
        });
        res.status(201).json({
            result: true,
            message: '모임 가입 성공',
        });
    } else {
        const memberStudys = await STUDYMEMBER.find({ studyMemberId: userId });
        const joinedStudyId = memberStudys.map((result) => result.studyId);
        const joinedStudys = await STUDY.find({ studyId: joinedStudyId });
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
        await MEETINGMEMBER.deleteOne({ meetingMemberId: userId, meetingId });
        res.status(201).json({
            result: true,
            message: '모임 탈퇴 성공',
        });
    }
}

async function kickMeetingMember(req, res) {
    const { targetId, meetingId } = req.body; // targetId: 강퇴를 당하는 사람의 Id (밴 당하는 유저)
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query; // 강퇴를 하는 사람의 Id (모임 마스터)

    const meeting = await MEETING.findOne({ meetingId });
    // FIXME res.locals가 작업되면 넘어오는 값이 int인지 아닌지 확인 후 수정
    // 모임 마스터만 내보내기가 가능하다.
    if (parseInt(userId) !== meeting.meetingMasterId) {
        return res.status(400).json({
            result: false,
            message: '모임 마스터만 내보내기가 가능합니다.',
        });
    }

    // 내보내려는 유저가 모임 마스터면 내보내기가 불가능하다.
    if (targetId === meeting.meetingMasterId) {
        return res.status(400).json({
            result: false,
            message: '모임 마스터는 내보내기가 불가능합니다.',
        });
    }

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
        const joinedStudys = await STUDY.find({ studyId: joinedStudyId });
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

    res.status(201).json({
        result: true,
        message: '모임 유저 내보내기 성공',
    });
}

// TODO 이미지 업데이트 시 기존 사진 삭제하는 로직 추가해야 함
async function modifyMeeting(req, res) {
    const {
        meetingId,
        meetingName,
        meetingCategory,
        meetingLocation,
        meetingIntro,
    } = req.body;
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query;

    const meeting = await MEETING.findOne({ meetingId });
    // FIXME res.locals가 작업되면 넘어오는 값이 int인지 아닌지 확인 후 수정
    if (parseInt(userId) !== meeting.meetingMasterId) {
        return res.status(400).json({
            result: false,
            message: '모임 마스터만 모임 정보 수정이 가능합니다.',
        });
    }

    if (req.file) {
        const meetingImage = req.file.location;
        await MEETING.updateOne(
            { meetingId, meetingMasterId: userId },
            {
                $set: {
                    meetingName,
                    meetingCategory,
                    meetingLocation,
                    meetingIntro,
                    meetingImage,
                },
            }
        );
    } else {
        await MEETING.updateOne(
            { meetingId, meetingMasterId: userId },
            {
                $set: {
                    meetingName,
                    meetingCategory,
                    meetingLocation,
                    meetingIntro,
                },
            }
        );
    }

    res.status(201).json({
        result: true,
        message: '모임 정보 수정 성공',
    });
}

async function deleteMeeting(req, res) {
    const { meetingId } = req.params;
    // FIXME res.locals가 작업되면 바꾼다.
    const { userId } = req.query;

    const meeting = await MEETING.findOne({ meetingId });
    // FIXME res.locals가 작업되면 넘어오는 값이 int인지 아닌지 확인 후 수정
    if (parseInt(userId) !== meeting.meetingMasterId) {
        return res.status(400).json({
            result: false,
            message: '모임 마스터만 모임 삭제가 가능합니다.',
        });
    }

    await MEETING.deleteOne({ meetingId, meetingMasterId: userId });
    await MEETINGMEMBER.deleteMany({ meetingId });
    const studyId = await STUDY.find({ meetingId }).then((value) =>
        value.map((result) => result.studyId)
    );
    await STUDYMEMBER.deleteMany({ studyId });
    await STUDY.deleteMany({ meetingId });
    await BANNEDUSER.deleteMany({ meetingId });

    res.status(201).json({
        result: true,
        message: '모임 삭제 성공',
    });
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
