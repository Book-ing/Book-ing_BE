const mongoose = require('mongoose');
const autoIdSetter = require('./auto-id-setter');

const studySchema = new mongoose.Schema({
    studyId: { type: Number, required: true },
    meetingId: { type: Number, required: true },
    studyType: { type: String, required: true },
});

autoIdSetter(studySchema, mongoose, 'Studys', 'studyId');
const Studys = mongoose.model('Studys', studySchema);
module.exports = Studys;
