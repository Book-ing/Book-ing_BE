const mongoose = require("mongoose")
const autoIdSetter = require("./auto-id-setter")

const userSchema = new mongoose.Schema({

    kakaoUserId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    profileImage: { type: String, },
    statusMessage: { type: String },
    refreshToken: { type: String, },
    regDate: { type: String, required: true },
    modDate: { type: String, }
})

autoIdSetter(userSchema, mongoose, 'users', 'userId')
const User = mongoose.model("User", userSchema)
module.exports = User  