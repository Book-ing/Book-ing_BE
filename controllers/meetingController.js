const Meeting = require('../schemas/meeting');
const moment = require('moment')
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

/*
    TODO 1. cookie에 유저 정보가 담기면 db에서 유저 검사 후 meetingMasterId 값으로 지정
         2. 모임은 한 사람당 하나만 만들 수 있기 때문에 만드려는 유저가 이미 만든 모임이 있는지 확인
         3. 기본 모임 이미지 협의 볼 것. url 형식이 아닐 수 있음.
         4. 카테고리, 지역 올바른 값인지 확인
 */
async function createMeeting(req, res) {
    const { meetingName, meetingCategory, meetingLocation, meetingIntro, meetingLimitCnt } = req.body;
    let meetingImage = "";
    if (req.file) {
        meetingImage = req.file.location;
    } else {
        meetingImage = "https://img.lovepik.com/element/40135/2302.png_300.png";
    }

    await Meeting.create({
        meetingMasterId: 1,
        meetingName,
        meetingCategory,
        meetingLocation,
        meetingImage,
        meetingIntro,
        meetingLimitCnt,
        regDate: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    res.status(201).json({ result: true, message: '모임 생성 성공' });
}

module.exports = {
    createMeeting
};