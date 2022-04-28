const mongoose = require("mongoose")

const codesSchema = new mongoose.Schema({

    codeId: { type: Number, required: true, unique: true },
    groupId: { type: Number, required: true, },
    codeName: { type: String, required: true, },
    codeValue: { type: String, required: true, },
    regDate: { type: String, required: true },
    modDate: { type: String }
})


const Codes = mongoose.model("Codes", codesSchema)
module.exports = Codes  