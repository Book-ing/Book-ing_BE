const app = require('./app');
const port = process.env.PORT || 3000;
const { server } = require('./socket');
const https = require('https');
const fs = require('fs');

if (process.env.PORT) {
    // 환경파일 내 PORT 정보가 존재한다면, 운영환경인 것으로 간주하며, 443번 포트로 서버를 열어준다.
    const privateKey = fs.readFileSync(
        '/etc/letsencrypt/live/sparta-hs.shop/privkey.pem',
        'utf8'
    );
    const certificate = fs.readFileSync(
        '/etc/letsencrypt/live/sparta-hs.shop/cert.pem',
        'utf8'
    );
    const ca = fs.readFileSync(
        '/etc/letsencrypt/live/sparta-hs.shop/chain.pem',
        'utf8'
    );

    const credentials = { key: privateKey, cert: certificate, ca: ca };

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
} else {
    // 환경파일 내 PORT 정보가 존재하지 않는다면, 로컬환경인 것으로 간주하며, 3000번 포트로 서버를 열어준다.
    server.listen(port, () => {
        console.log(port, '번으로 서버가 연결되었습니다.');
        console.log(`http://localhost:${port}`);
    });
}
