const mongoose = require('mongoose');

const offlineStudySchema = new mongoose.Schema({
    studyId: { type: Number, required: true },
    meetingId: { type: Number, required: true },
    studyMasterId: { type: Number, required: true },
    studyType: { type: String, required: true },
    studyTitle: { type: String, required: true },
    studyDateTime: { type: String, required: true },
    studyAddr: { type: String, required: true },
    Lat: { type: Number, required: true },
    Long: { type: Number, required: true },
    studyAddrDetail: { type: String, required: true },
    studyLimitCnt: { type: Number, required: true },
    studyPrice: { type: Number },
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

const OfflineStudys = mongoose.model('OfflineStudys', offlineStudySchema);
module.exports = OfflineStudys;
