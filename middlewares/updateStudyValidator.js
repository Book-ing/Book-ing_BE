const { body, validationResult } = require('express-validator');

const error = (req, res, next) => {
    const errors = validationResult(req);
    console.log('validateError : ', errors['errors']);
    if (errors.isEmpty()) {
        return next();
    }
    console.log(errors.array()[0].msg);
    return res.json({ result: 'fail', errorMessage: errors.array()[0].msg });
};

const updateStudyValidation = [
    body('meetingId')
        .notEmpty()
        .withMessage('스터디는 모임안에 소속되어 있어야 합니다. 무언가 에러가 발생한 거 같으니 개발자에게 문의하세요'),
    body('studyTitle')
        .notEmpty()
        .withMessage('수정하실 때 제목 까먹지 마세요~')
        .isLength({ max: 80 })
        .withMessage('스터디 이름은 80자 이상 입력할 수 없습니다.'),
    body('studyDateTime').notEmpty().withMessage('스터디 일시가 빠졌습니다!'),
    body('studyAddr').notEmpty().withMessage('주소도 입력해주셔야 해요!!'),
    body('studyNotice')
        .isLength({ max: 600 })
        .withMessage('스터디 공지는 최대 600자까지 입력할 수 있습니다'),
    body('studyAddrDetail')
        .notEmpty()
        .withMessage('스터디 할 상세 주소도 입력해주세요!'),
    error,
];

module.exports = updateStudyValidation;
