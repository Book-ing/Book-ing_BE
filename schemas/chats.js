const mongoose = require("mongoose")
const autoIdSetter = require("./auto-id-setter")

const chatsSchema = new mongoose.Schema({


    meetingId: { type: Number, required: true, unique: true },
    userId: { type: Number, required: true, unique: true },
    message: { type: String, required: true },
    redDate: { type: String, required: true },
    modDate: { type: String }
})

autoIdSetter(chatsSchema, mongoose, 'chats', 'chatId')
const Chats = mongoose.model("Chats", chatsSchema)
module.exports = Chats  