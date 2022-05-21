require('dotenv').config();
const httpMocks = require('node-mocks-http');
const meetingController = require('../meetingController');
jest.mock('../../schemas/meeting');
jest.mock('../../schemas/meetingMember');
jest.mock('../../schemas/studys');
jest.mock('../../schemas/user');
jest.mock('../../schemas/codes');
const MEETING = require('../../schemas/meeting');
const MEETINGMEMBER = require('../../schemas/meetingMember');
const STUDY = require('../../schemas/studys');
const USER = require('../../schemas/user');
const CODE = require('../../schemas/codes');

let req;
let res;
beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    res.locals.user = { userId: 1 };
});

describe('meeting test', () => {
    describe('createMeeting test', () => {
        beforeEach(() => {
            req.body = {
                meetingName: '모임 제목',
                meetingCategory: '시',
                meetingLocation: '서울',
                meetingIntro: '모임 소개',
                meetingLimitCnt: 300,
            };
        });
        it('한 유저가 이미 만든 모임이 있으면 새로운 모임을 만들 수 없다.', async () => {
            MEETING.findOne.mockReturnValue(true);
            await meetingController.createMeeting(req, res);
            expect(res.statusCode).toEqual(400);
            expect(res._getJSONData().message).toEqual('이미 생성한 모임이 있습니다.');
        });
        it('CODE에 등록되지 않은 카테고리를 입력하면 오류가 난다.', async () => {
            CODE.findOne.mockReturnValue(null);
            await meetingController.createMeeting(req, res);
            expect(res.statusCode).toEqual(400);
            expect(res._getJSONData().message).toEqual('모임 카테고리 입력 오류');
        });
        it('생성이 되면 201 코드와 json이 리턴이 되나요?', async () => {
            CODE.findOne.mockReturnValue(true);
            MEETING.create.then(MEETINGMEMBER.create.mockReturnValue());
            await meetingController.createMeeting(req, res);
            expect(res.statusCode).toEqual(201);
        });
    });

    describe('getMeetingInfo test', () => {
        it('조회가 잘 되나요?', async () => {
            req.params.meetingId = 1;
            MEETING.findOne.mockReturnValue({
                meetingCategory: '시',
                meetingLocation: '서울',
                meetingMasterId: 2
            });
            STUDY.find.count().mockReturnValue([1, 2, 3]);
            await meetingController.getMeetingInfo(req, res);
            expect(res.statusCode).toEqual(200);
        });
    });

    describe('getMeetingUsers test', () => {
        it('', async () => {

        });
    });
});