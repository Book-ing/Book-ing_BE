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

const createMeetingValidation = [
    body('meetingName')
        .notEmpty()
        .withMessage('모임 이름을 입력해 주세요.')
        .isLength({ max: 80 })
        .withMessage('모임 이름은 80자 이상 입력할 수 없습니다.'),
    body('meetingCategory')
        .notEmpty()
        .withMessage('모임 카테고리를 선택해주세요.'),
    body('meetingIntro')
        .notEmpty()
        .withMessage('모임 소개를 입력해 주세요.')
        .isLength({ max: 200 })
        .withMessage('모임 소개는 200자 이상 입력할 수 없습니다.'),
    body('meetingLocation')
        .notEmpty()
        .withMessage('모임 지역을 선택해주세요.'),
    body('meetingLimitCnt')
        .notEmpty()
        .withMessage('모임 인원 수 제한을 입력해 주세요.')
        .custom(value => {
            if (value > 300) throw new Error('모임 최대 인원수 제한은 300명입니다.');
            return true;
        }),
    error,
];




module.exports = createMeetingValidation;
