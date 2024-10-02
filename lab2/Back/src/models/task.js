const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    created_at: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: false
    },
}, { versionKey: false })

module.exports = mongoose.model('Task', taskSchema);   