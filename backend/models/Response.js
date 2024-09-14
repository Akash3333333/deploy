const mongoose = require('mongoose');


const responseSchema = new mongoose.Schema({
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    answers: [{
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        answer: Number, // index of the selected option
        markAwarded: Number
    }],
    score:Number,
    timeTaken:Number,
    startTime:Date,
    submittedAt: Date
});


const Response = mongoose.model('Response', responseSchema);

module.exports = Response;