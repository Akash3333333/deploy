const mongoose = require('mongoose');
const commentSchema = require('./Comment');

const mainThreadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to the Category schema
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
});

const MainThread = mongoose.model('MainThread', mainThreadSchema);

module.exports = MainThread;
