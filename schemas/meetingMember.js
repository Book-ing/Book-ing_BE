const mongoose = require("mongoose")

const meetingMemberSchema = new mongoose.Schema({

    meetingMemberId: { type: Number, required: true, },
    meetingId: { type: Number, required: true, },
    isMeetingMaster: { type: Boolean, required: true, default: false },
    redDate: { type: String, required: true },
    modDate: { type: String }
})


const MeetingMembers = mongoose.model("MeetingMembers", meetingMemberSchema)
module.exports = MeetingMembers  