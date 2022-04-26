const mongoose = require("mongoose")
const autoIdSetter = require("./auto-id-setter")

const meetingSchema = new mongoose.Schema({


    meetingMasterId: { type: Number, unique: true },
    meetingName: { type: String, required: true },
    meetingCategory: { type: String, required: true },
    meetingLocation: { type: String, required: true },
    meetingImage: { type: String, },
    meetingIntro: { type: String, required: true },
    meetingLimitCnt: { type: Number, required: true },
    redDate: { type: String, required: true },
    modDate: { type: String }
})

autoIdSetter(meetingSchema, mongoose, 'Meetings', 'meetingId')
const Meetings = mongoose.model("Meetings", meetingSchema)
module.exports = Meetings   