require('dotenv').config();
const { Logger, stream } = require('./logging');
const express = require('express');
const app = express();
const connect = require('./schemas');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const passportConfig = require('./passport/kakaoStrategy');

app.use(cors({ origin: '*' }));
app.use(morgan('dev', { stream }));
connect();

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output');

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.disable('x-powered-by');

app.use(passport.initialize());
passportConfig();

const Router = require('./routes');
app.use('/api', Router);

app.use((req, res, next) => {
    res.status(404).send('요청하신 페이지를 찾을 수 없습니다.');
});

app.use((err, req, res, next) => {
    Logger.error(`${err.message} \n ${err.stack ? err.stack : ""} `)
    res.status(err.status || 400).json({ result: false, message: err.message });
});

module.exports = app;
