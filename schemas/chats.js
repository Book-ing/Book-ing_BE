const mongoose = require('mongoose');
const autoIdSetter = require('./auto-id-setter');

const chatsSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    userId: { type: Number, required: true },
    message: { type: String, required: true },
    regDate: { type: String, required: true },
    modDate: { type: String },
});

autoIdSetter(chatsSchema, mongoose, 'chats', 'chatId');
const Chats = mongoose.model('Chats', chatsSchema);
module.exports = Chats;
