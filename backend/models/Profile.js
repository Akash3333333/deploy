const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
  },
  dob: {
    type: Date,
  },
  about: {
    type: String,
  },
});

module.exports = mongoose.model("Profile", profileSchema);
