const mongoose = require("mongoose");
const connect = () => {
  mongoose
    .connect(`${process.env.MONGO_URL}`, { ignoreUndefined: true })
    .catch((err) => {
      if (err) throw err;
      console.log("데이터베이스에 연결되었습니다. : " + databaseUrl);
    });
  console.log("mongoDB 연결 완료");
};

module.exports = connect;