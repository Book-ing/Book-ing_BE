const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

/**
 * 2022. 05. 02. HSYOO.
 * @param {*} input 계산할 숫자 값을 입력합니다. EX) 30일의 경우 30, 1년의 경우 1
 * @param {*} attr hours: 시간, days: 일, months: 월, years: 년
 * @returns String: YYYY-MM-DD HH:mm:ss
 */
function getDate(input, attr) {
    let result = '';

    // 둘 다 입력되지 않는다면, 현재시간을 내려준다.
    if (!input && !attr) return moment().format('YYYY-MM-DD HH:mm:ss');
    else {
        if (input && attr) {
            switch (attr) {
                case 'hours':
                    return moment()
                        .add(input, 'hours')
                        .format('YYYY-MM-DD HH:mm:ss');
                case 'days':
                    return moment()
                        .add(input, 'days')
                        .format('YYYY-MM-DD HH:mm:ss');
                case 'months':
                    return moment()
                        .add(input, 'months')
                        .format('YYYY-MM-DD HH:mm:ss');
                case 'years':
                    return moment()
                        .add(input, 'years')
                        .format('YYYY-MM-DD HH:mm:ss');
                default:
                    return new Error('올바르지 않은 인자 값: attr');
            }
        } else {
            return new Error('인자 값이 충분하지 않습니다.');
        }
    }

    // if(!input && !attr)

    // else if()
    return result;
}

module.exports = { getDate };
