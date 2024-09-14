const mongoose = require('mongoose');
require('dotenv').config();

exports.connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {});
        console.log("CONNECTED TO DATABASE SUCCESSFULLY");
    } catch (error) {
        console.error('COULD NOT CONNECT TO DATABASE:', error);
    }
};
