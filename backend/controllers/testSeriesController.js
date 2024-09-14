const TestSeries = require('../models/TestSeries');
const User = require('../models/User'); // Update path as needed

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');


// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });
  
  // Middleware to handle file uploads
  const uploadMiddleware = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
  ]);

exports.createTestSeries = (req, res) => {
    upload.single('thumbnail')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        const { title, description, price, tests, category} = req.body;
        const createdBy = req.user.id; // Assuming req.user.id contains the ID of the creator
            parsedTests = JSON.parse(tests);
        

        
        try {
            const newTestSeries = new TestSeries({
                title,
                description,
                price,
                createdBy, // Convert createdBy to ObjectId
                tests:parsedTests, // Convert tests array to ObjectId array
                category,
                thumbnail: req.file ? `/uploads/${req.file.filename}` : null // Save the thumbnail path if provided
            });

            await newTestSeries.save();
            const user=await User.findById(req.user.id);
            user.TestSeries.push(newTestSeries._id);
            await user.save();

            res.status(201).json(newTestSeries);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });
};



exports.getTestSeriesById = async (req, res) => {
    try {
        const testSeries = await TestSeries.findById(req.params.testSeriesId)
            .populate({
                path: 'createdBy',
                select: 'firstName lastName', // Populate user fields
            })
            .populate({
                path: 'tests', // Populate tests
                select: 'title description startTime duration', // Select the fields you want
            });

        if (!testSeries) {
            return res.status(404).json({ msg: 'Test series not found' });
        }

        res.json(testSeries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteTestSeries = async (req, res) => {
    try {
        let testSeries = await TestSeries.findById(req.params.testSeriesId);
        if (!testSeries) {
            return res.status(404).json({ msg: 'Test series not found' });
        }

        await TestSeries.findByIdAndRemove(req.params.testSeriesId);
        res.json({ msg: 'Test series removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllTestSeriesByUser = async (req, res) => {
    try {
        const testSeries = await TestSeries.find({ createdBy: req.user.id });
        res.json(testSeries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllTestSeries = async (req, res) => {
    try {
        const testSeries = await TestSeries.find().populate('createdBy', 'firstName lastName'); // Populate createdBy with name field from User
        res.json(testSeries);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Buy Test Series
exports.buyTestSeries = async (req, res) => {
    try {
        const userId = req.user.id; // Current logged-in user ID (from auth middleware)
        const testSeriesId = req.params.testSeriesId; // Test Series ID from URL params

        // Fetch the test series by ID
        const testSeries = await TestSeries.findById(testSeriesId);

        if (!testSeries) {
            return res.status(404).json({ message: 'Test Series not found' });
        }

        // Fetch the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user has already purchased the test series
        if (user.TestSeries.includes(testSeriesId)) {
            return res.status(400).json({ message: 'You have already purchased this test series' });
        }

        // Add the test series to the user's TestSeries array
        user.TestSeries.push(testSeriesId);

        // Add the user to the test series' usersPurchased array (if needed)
        // testSeries.usersPurchased.push(userId);

        // Save both user and test series
        await user.save();
        // await testSeries.save(); // Uncomment if you need to save the test series updates

        res.status(200).json({ message: 'Test Series purchased successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Purchased Test Series
exports.getPurchasedTestSeries = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from the authenticated request
        const user = await User.findById(userId).populate('TestSeries'); // Populate the TestSeries field

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.TestSeries); // Return the list of purchased test series
    } catch (error) {
        console.error('Error fetching purchased test series:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check Test Series Purchase Status
exports.checkTestSeriesPurchaseStatus = async (req, res) => {
    try {
        const userId = req.user.id; // Extract user ID from the authenticated request
        const { testSeriesId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const purchased = user.TestSeries.includes(testSeriesId);
        res.json({ purchased });
    } catch (error) {
        console.error('Error checking test series purchase status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyTestSeries = async (req, res) => {
    try {
        // Get the user ID from the authenticated request (assumed to be set in req.user)

        // Find the user by ID to get their enrolled course IDs
        const userId = req.user.id; // Assuming req.user contains user info
        // Find the user and populate the courses field
        const user = await User.findById(userId).populate('TestSeries');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the enrolled courses as a response
        res.json(user.TestSeries);
    } catch (error) {
        console.error(error);
        
        res.status(500).json({ message: 'Server Error' });
    }
}
