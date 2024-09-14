const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String }
}, { timestamps: true });

const testSeriesSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number, // price of the test series
    thumbnail:String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to the Category schema
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
    reviews: [reviewSchema],

    createdAt: { type: Date, default: Date.now }
});


const TestSeries = mongoose.model('TestSeries', testSeriesSchema);

module.exports = TestSeries;