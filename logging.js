const winston = require('winston');
const WinstonDaily = require('winston-daily-rotate-file'); //날짜별로 로그 저장
const path = require('path');
const { combine, timestamp, printf, colorize } = winston.format;

const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
const timezone = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss:ms');
};

const logDir = process.env.LOGDIR || 'logs';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'http';
};

const logFormat = combine(
    timestamp({ format: timezone() }),
    printf((info) => {
        if (info.stack) {
            return `${ info.timestamp } ${ info.level }: ${ info.message } \n Error Stack: ${ info.stack }`;
        }
        return `${ timezone(info.timestamp) } ${ info.level }: ${ info.message }`;
    }),
);

const consoleOpts = {
    handleExceptions: true,
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: combine(colorize({ all: true }), timestamp({ format: timezone() })),
};

const transports = [
    new winston.transports.Console(consoleOpts),
    new WinstonDaily({
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        dirname: path.join(logDir, '/error'),
        filename: '%DATE%.error.log',
        maxFiles: 30,
        zippedArchive: true,
    }),
    new WinstonDaily({
        level: 'debug',
        datePattern: 'YYYY-MM-DD',
        dirname: path.join(logDir, '/all'),
        filename: '%DATE%.all.log',
        maxFiles: 7,
        zippedArchive: true,
    }),
];

const Logger = winston.createLogger({
    level: level(),
    levels,
    format: logFormat,
    transports,
});

const stream = {
    write: (message) => {
        Logger.info(message.substring(0, message.lastIndexOf('\n')));
    },
};

module.exports = { Logger, stream };