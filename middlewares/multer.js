const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_S3_ID,
    secretAccessKey: process.env.AWS_S3_SECRET,
    region: 'ap-northeast-2',
});

const limits = {
    fileSize: 3 * 1024 * 1024, // multipart 형식 폼에서 최대 파일 사이즈(bytes) "3MB 설정" (기본 값 무제한)
    files: 1, // multipart 형식 폼에서 파일 필드 최대 개수 (기본 값 무제한)
};

const fileFilter = (req, file, callback) => {
    const typeArray = file.mimetype.split('/');
    const fileType = typeArray[1]; // 이미지 확장자 추출

    //이미지 확장자 구분 검사
    if (
        fileType === 'jpg' ||
        fileType === 'jpeg' ||
        fileType === 'png' ||
        fileType === 'gif' ||
        fileType === 'svg' ||
        fileType === 'bmp' ||
        fileType === 'webp' ||
        fileType === 'heic' ||
        fileType === 'heif'
    ) {
        callback(null, true);
    } else {
        return callback(
            { message: '지원되는 이미지파일 형식이 아닙니다.' },
            false
        );
    }
};

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(
                null,
                Math.floor(Math.random() * 1000).toString() +
                    Date.now() +
                    '.' +
                    file.originalname.split('.').pop()
            );
        },
    }),
    limits: limits,
    fileFilter: fileFilter,
});

const deleteImage = (url) => {
    if (url === 'https://img.lovepik.com/element/40135/2302.png_300.png')
        return;
    const filename = url.split('/')[3];
    s3.deleteObject(
        {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: filename,
        },
        function (err, data) {}
    );
};

module.exports = { upload, deleteImage };
