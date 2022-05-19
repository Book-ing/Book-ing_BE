require('dotenv').config();
const httpMocks = require('node-mocks-http');
const meetingController = require('../meetingController');
jest.mock('../../schemas/meeting');
jest.mock('../../schemas/meetingMember');
jest.mock('../../schemas/user');
jest.mock('../../schemas/codes');
jest.mock('../../middlewares/validator');
const MEETING = require('../../schemas/meeting');
const MEETINGMEMBER = require('../../schemas/meetingMember');
const USER = require('../../schemas/user');
const CODE = require('../../schemas/codes');
const { createMeetingValidation, modifyMeetingValidation } = require('../../middlewares/validator');

let req;
let res;
beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse({
        locals: {
            user: {
                userId: 1
            }
        }
    });
})

// beforeAll(async () => {
//     const res = jest.fn(() => {
//         status: jest.fn(() => {
//             send: jest.fn()
//         })
//     })
// })
describe('meeting test', () => {
    describe('createMeeting test', () => {
        // const req = {
        //     body: {
        //         meetingName: '모임 이름',
        //         meetingCategory: '에세이',
        //         meetingLocation: '서울',
        //         meetingIntro: '모임 소개',
        //         // meetingLimitCnt: 300
        //     }
        // };
        // const res = {
        //     locals: {
        //         user: {
        //             userId: 1
        //         }
        //     },
        //     status: jest.fn(() => res),
        //     json: jest.fn()
        // };
        // it('한 유저가 이미 만든 모임이 있으면 새로운 모임을 만들 수 없다.', async () => {
        //     MEETING.findOne.mockResolvedValue(true);
        //     await meetingController.createMeeting(req, res);
        //     expect(res.status).toBeCalledWith(400);
        //     expect(res.json).toBeCalledWith({"message": "이미 생성한 모임이 있습니다.", "result": false});
        // });
        it('CODE에 등록되지 않은 카테고리를 입력하면 오류가 난다.', async () => {
            CODE.findOne.mockResolvedValue(null);
            await meetingController.createMeeting(req, res);
            console.log('req', req, 'res', res);
            expect(res.statusCode).toEqual(400);
            expect(res._getJSONData().message).toEqual('모임 카테고리 입력 오류');
        });
        it('한 유저가 이미 만든 모임이 있으면 새로운 모임을 만들 수 없다.', async () => {
            MEETING.findOne.mockResolvedValue(true);
            await meetingController.createMeeting(req, res);
            expect(res.statusCode).toEqual(400);
            expect(res._getJSONData().message).toEqual('이미 생성한 모임이 있습니다.');
        });
    });

    describe('getMeetingInfo test', () => {
        it('조회가 잘 되나요?', async () => {
            req.params = 1;
            // MEETING.findOne.mockResolvedValue(1);

            await meetingController.getMeetingInfo(req, res);
            console.log(res._getJSONData().message);
        });
    });

    describe('getMeetingUsers test', () => {
        it('', async () => {

        });
    });
});