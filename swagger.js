const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Book-ing',
        description: '항해99 6기 A 1조 실전 프로젝트 Book-ing',
    },
    host: 'localhost:3000',
    schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
