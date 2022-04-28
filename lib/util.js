const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

function getDate(){
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

module.exports = { getDate };