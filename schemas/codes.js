const mongoose = require("mongoose")

const codesSchema = new mongoose.Schema({

    codeId: { type: Number, unique: true },
    groupId: { type: Number, },
    codeName: { type: String, },
    codeValue: { type: String, },
    regDate: { type: String, },
    modDate: { type: String }
})


const Codes = mongoose.model("Codes", codesSchema)
module.exports = Codes  