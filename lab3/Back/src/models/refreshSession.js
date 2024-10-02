const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const refreshSessionSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    refreshToken: {type: mongoose.Types.UUID, required: true},
    ua: {type: String},
    fingerprint: {type: String, required: true},
    ip: {type: String},
    expiresIn: {type: Number, required: true},
    createdAt: {type: Number, required: true},
}, { versionKey: false })

module.exports = mongoose.model('RefreshSession', refreshSessionSchema);   