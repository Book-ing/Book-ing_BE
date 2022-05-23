const { body, validationResult } = require('express-validator');

const error = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }
    console.log(errors.array()[0].msg);
    return res.json({ result: false, message: errors.array()[0].msg });
};

const createOnlineStudyValidation = [
    body('meetingId')
        .notEmpty()
        .withMessage('모임 아이디는 필수값 입니다.'),
    body('studyType')
        .notEmpty()
        .withMessage('스터디 타입은 필수값 입니다.'),
    body('studyTitle')
        .notEmpty()
        .withMessage('스터디 제목을 입력해주세요.')
        .isLength({ max: 80 })
        .withMessage('스터디 이름은 80자 이상 입력할 수 없습니다.'),
    body('studyDateTime')
        .notEmpty()
        .withMessage('스터디 일시를 선택해주세요!'),
        // .isDate({format: 'YYYY-MM-DD HH:mm'})
        // .withMessage('스터디 날짜를 날짜 형식으로 입력해주세요'),
    body('studyNotice')
        .isLength({ max: 600 })
        .withMessage('스터디 공지는 최대 600자까지 입력할 수 있습니다'),
    // body('studyBookImg')
    //     .isURL()
    //     .withMessage('책 이미지는 url 형식이여야함'),
    body('studyLimitCnt')
        .notEmpty()
        .withMessage('스터디 정원을 반드시 입력해주세요')
        .custom((value) => {
            if (value > 10 || value < 2)
                throw new Error('스터디 인원수 제한은 2~10명입니다.');
            return true;
        }),
    error,
];

const createOfflineStudyValidation = [
    body('meetingId')
        .notEmpty()
        .withMessage('모임 아이디는 필수값 입니다.'),
    body('studyTitle')
        .notEmpty()
        .withMessage('스터디 제목을 입력해주세요.')
        .isLength({ max: 80 })
        .withMessage('스터디 이름은 80자 이상 입력할 수 없습니다.'),
    body('studyDateTime').notEmpty().withMessage('스터디 일시를 선택해주세요!'),
    body('studyAddr').notEmpty().withMessage('스터디 할 주소를 입력해주세요'),
    body('studyNotice')
        .isLength({ max: 600 })
        .withMessage('스터디 공지는 최대 600자까지 입력할 수 있습니다'),
    body('studyAddrDetail')
        .notEmpty()
        .withMessage('스터디 할 상세 주소도 입력해주세요!'),
    body('studyLimitCnt')
        .notEmpty()
        .withMessage('스터디 정원을 반드시 입력해주세요')
        .custom((value) => {
            if (value > 300 || value < 2)
                throw new Error('스터디 최대 인원수 제한은 300명입니다.');
            return true;
        }),
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

module.exports = { createOnlineStudyValidation, createOfflineStudyValidation, updateStudyValidation };
