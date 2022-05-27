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

// const whitelist = ['http://localhost:3000', 'http://twitter-clone-coding.s3-website.ap-northeast-2.amazonaws.com'];
// const corsOptions = {
// 	origin: function (origin, callback) {
// 		if(whitelist.indexOf(origin) !== -1){
// 			callback(null, true);
// 		}else{
// 			callback(new Error('Not Allowed Origin!'));
// 		}
// 	},
// 	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
// 	preflightContinue: false,
// 	optionsSuccessStatus: 204,
// 	credentials: true,
// };

app.use(cors({ origin: '*' }));
app.use(morgan('dev', { stream }));
connect();

const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output');

const authRouter = require('./routes/');

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
