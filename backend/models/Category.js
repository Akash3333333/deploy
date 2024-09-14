    const mongoose = require('mongoose');


    const categorySchema = new mongoose.Schema({
        name: { type: String, required: true, unique: true },
        courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
        testSeries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries' }]
    });

    const Category = mongoose.model('Category', categorySchema);
    module.exports = Category;
