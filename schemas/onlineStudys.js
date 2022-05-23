const mongoose = require('mongoose');

const onlineStudySchema = new mongoose.Schema({
    studyId: { type: Number, required: true },
    meetingId: { type: Number, required: true },
    studyMasterId: { type: Number, required: true },
    studyType: { type: String, required: true },
    studyTitle: { type: String, required: true },
    studyDateTime: { type: String, required: true },
    studyLimitCnt: { type: Number, required: true },
    studyNotice: { type: String },
    studyBookImg: { type: String },
    studyBookTitle: { type: String },
    studyBookInfo: { type: String },
    studyBookWriter: { type: String },
    studyBookPublisher: { type: String },
    studyNote: { type: String },
    regDate: { type: String, required: true },
    modDate: { type: String },
});

const OnlineStudys = mongoose.model('OnlineStudys', onlineStudySchema);
module.exports = OnlineStudys;
