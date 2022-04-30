const mongoose = require('mongoose');

const studyMemberSchema = new mongoose.Schema({
    studyMemberId: { type: Number, required: true },
    studyId: { type: Number, required: true },
    isStudyMaster: { type: Boolean, required: true, default: false },
    regDate: { type: String, required: true },
    modDate: { type: String },
});

const StudyMembers = mongoose.model('StudyMembers', studyMemberSchema);
module.exports = StudyMembers;
