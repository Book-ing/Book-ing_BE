const express = require('express');
const router = express.Router();
const request = require('request');


const RESTAPI_KEY = process.env.KAKAO_RESTAPI_KEY
let kakaoOptions = {
    method: 'GET',
    url: 'https://dapi.kakao.com/v3/search/book?target=title',  // target에 해당하는 것을 적기
    headers: {
        'Authorization': `KakaoAK ${RESTAPI_KEY}`
    },
    qs: {
        query: ''     // 현재 책으로 검색할 것이라 책 제목을 적었다.
    },
    encoding: 'UTF-8',
}

request(kakaoOptions, function (err, res, body) {
    if (!err && res.statusCode == 200) {
        console.log(JSON.parse(body));
    }
})


module.exports = kakaoOptions;