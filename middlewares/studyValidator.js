const { body, validationResult } = require('express-validator');

const error = (req, res, next) => {
    const errors = validationResult(req);
    console.log('validateError : ', errors['errors']);
    if (errors.isEmpty()) {
        return next();
    }
    console.log(errors.array()[0].msg);
    return res.json({ result: false, message: errors.array()[0].msg });
};

const createStudyValidation = [
    body('meetingId')
        .notEmpty()
        .withMessage('스터디는 모임을 만든 후에 만들 수 있습니다'),
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
            if (value > 300)
                throw new Error('스터디 최대 인원수 제한은 300명입니다.');
            return true;
        }),
    error,
];

module.exports = createStudyValidation;
