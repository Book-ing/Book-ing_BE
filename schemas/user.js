const mongoose = require("mongoose")
const autoIdSetter = require("./auto-id-setter")

const userSchema = new mongoose.Schema({

    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    profileImage: { type: String, required: true },
    statusMessage: { type: String },
    refreshToken: { type: String, required: true },
    redDate: { type: String, required: true },
    modDate: { type: String }
})

autoIdSetter(userSchema, mongoose, 'users', 'userId')
const User = mongoose.model("User", userSchema)
module.exports = User  