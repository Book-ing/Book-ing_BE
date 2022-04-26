const mongoose = require("mongoose")
const autoIdSetter = require("./auto-id-setter")

const studySchema = new mongoose.Schema({

    studyId: { type: Number, required: true, unique: true },
    meetingId: { type: Number, required: true, },
    studyMasterId: { type: Number, required: true, unique: true },
    studyTitle: { type: String, required: true },
    studyDateTime: { type: String, required: true },
    studyAddr: { type: String, required: true },
    studyAddrDetail: { type: String, required: true },
    studyLimitCnt: { type: Number, required: true },
    studyPrice: { type: Number },
    studyNotice: { type: String },
    studyBookImg: { type: String },
    studyBookTitle: { type: String },
    studyBookInfo: { type: String },
    studyNote: { type: String },
    redDate: { type: String, required: true },
    modDate: { type: String }
})

autoIdSetter(studySchema, mongoose, 'studys', 'studyId')
const Studys = mongoose.model("Studys", studySchema)
module.exports = Studys      