const User = require("../models/User");
const Profile = require("../models/Profile"); //

exports.updateProfile = async (req, res) => {
  const { firstName, lastName, dob, gender, about, email } = req.body;
  try {
    // Update the User document
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    // Update the Profile document
    const profile = await Profile.findById(user.profileDetails);
    if (profile) {
      if (dob) profile.dob = dob;
      if (gender) profile.gender = gender;
      if (about) profile.about = about;
      await profile.save();
    }

    await user.save();
    res.status(200).send({
      firstName: user.firstName,
      lastName: user.lastName,
      dob: profile.dob,
      email: user.email,
      gender: profile.gender,
      about: profile.about,
    });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Find the profile
    const profile = await Profile.findById(user.profileDetails);
    if (!profile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Send the user's profile data in the response
    res.status(200).send({
      id:user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      dob: profile.dob,
      email: user.email,
      gender: profile.gender,
      about: profile.about,
    });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.getRole = async (req, res) => {
  const userId = req.user.id; 

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};



exports.getInstructors = async (req, res) => {

  try {
    const users = await User.find({ role:'Instructor' });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};