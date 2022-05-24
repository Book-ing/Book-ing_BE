const { body, validationResult } = require('express-validator');

const error = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }
    console.log(errors.array()[0].msg);
    return res.status(400).json({ result: false, message: errors.array()[0].msg });
};

const createStudyValidation = [
    body('meetingId')
        .notEmpty()
        .withMessage('모임 아이디는 필수 값 입니다.'),
    body('studyType')
        .notEmpty()
        .withMessage('스터디 타입은 필수 값 입니다.')
        .custom((value) => {
            if (value !== 'online' && value !== 'offline')
                throw new Error('스터디 타입은 online 또는 offline 이여야합니다.');
            return true;
        }),
    body('studyTitle')
        .notEmpty()
        .withMessage('스터디 제목은 필수 값 입니다.')
        .isLength({ max: 80 })
        .withMessage('스터디 이름은 80자 이상 입력할 수 없습니다.'),
    body('studyDateTime')
        .notEmpty()
        .withMessage('스터디 일자은 필수 값 입니다.'),
    body('studyNotice')
        .notEmpty()
        .withMessage('스터디 공지 필수 값 입니다.')
        .isLength({ max: 600 })
        .withMessage('스터디 공지는 최대 600자까지 입력할 수 있습니다'),
    body('studyLimitCnt')
        .notEmpty()
        .withMessage('스터디 제한 인원은 필수 값 입니다.'),
    error,
];

const updateStudyValidation = [
    body('meetingId')
        .notEmpty()
        .withMessage('스터디는 모임안에 소속되어 있어야 합니다.'),
    body('studyTitle')
        .notEmpty()
        .withMessage('수정할 때도 스터디 제목은 필수 입력값입니다')
        .isLength({ max: 80 })
        .withMessage('스터디 이름은 80자 이상 입력할 수 없습니다.'),
    body('studyDateTime')
        .notEmpty()
        .withMessage('스터디 일시도 필수 입력값입니다'),
    body('studyAddr').notEmpty().withMessage('주소도 필수 입력값입니다'),
    body('studyNotice')
        .isLength({ max: 600 })
        .withMessage('스터디 공지는 최대 600자까지 입력할 수 있습니다'),
    body('studyAddrDetail')
        .notEmpty()
        .withMessage('스터디 할 상세 주소도 필수 입력값입니다.'),
    error,
];

module.exports = { createStudyValidation, updateStudyValidation };
