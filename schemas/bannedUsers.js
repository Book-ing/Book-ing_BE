const mongoose = require("mongoose")
const autoIdSetter = require("./auto-id-setter")

const bannedUserSchema = new mongoose.Schema({

    bannedUserId: { type: Number, required: true, unique: true },
    meetingId: { type: Number, required: true, },
    userId: { type: Number, required: true, },
    redDate: { type: String, required: true },
    modDate: { type: String }
})

autoIdSetter(bannedUserSchema, mongoose, 'bannedUsers', 'bannedUserId')
const BannedUsers = mongoose.model("BannedUsers", bannedUserSchema)
module.exports = BannedUsers  