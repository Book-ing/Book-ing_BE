const mongoose = require('mongoose');
const autoIdSetter = require('./auto-id-setter');

const studySchema = new mongoose.Schema({
    meetingId: { type: Number, required: true },
    studyType: { type: Number, required: true },
});

autoIdSetter(studySchema, mongoose, 'Studys', 'studyId');
const Studys = mongoose.model('Studys', studySchema);
module.exports = Studys;
