const mongoose = require('mongoose');
const autoIdSetter = require('./auto-id-setter');

const studySchema = new mongoose.Schema({
    meetingId: { type: Number, required: true },
    studyType: { type: Number, required: true },
    studyMasterId: { type: Number, required: true },
    studyTitle: { type: String, required: true },
    studyDateTime: { type: String, required: true },
    studyAddr: { type: String },
    studyAddrDetail: { type: String },
    Lat: { type: Number },
    Long: { type: Number },
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

autoIdSetter(studySchema, mongoose, 'Studys', 'studyId');
const Studys = mongoose.model('Studys', studySchema);
module.exports = Studys;
