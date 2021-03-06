const mongoose = require('mongoose');
const autoIdSetter = require('./auto-id-setter');

const bannedUserSchema = new mongoose.Schema({
    meetingId: { type: Number, required: true },
    userId: { type: Number, required: true },
    regDate: { type: String, required: true },
    modDate: { type: String },
});

autoIdSetter(bannedUserSchema, mongoose, 'bannedUsers', 'bannedUserId');
const BannedUsers = mongoose.model('BannedUsers', bannedUserSchema);
module.exports = BannedUsers;
