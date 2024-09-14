const express = require('express');
const router = express.Router();
const { authenticateUser, isInstructor } = require('../config/authMiddleware');
const testSeriesController = require('../controllers/testSeriesController');
const cron = require('node-cron');
const Test = require('../models/Test'); // Import the Test model

// Create a test series
router.post('/create', authenticateUser, isInstructor, testSeriesController.createTestSeries);

// Get a test series by ID
router.get('/:testSeriesId', testSeriesController.getTestSeriesById);

// Delete a test series
router.delete('/delete/:testSeriesId', authenticateUser, isInstructor, testSeriesController.deleteTestSeries);

// Get all test series created by user
router.get('/getAll', authenticateUser, isInstructor, testSeriesController.getAllTestSeriesByUser);

router.get('/', testSeriesController.getAllTestSeries);

router.post('/buy-testseries/:testSeriesId', authenticateUser, testSeriesController.buyTestSeries);

// Route to get purchased test series for the logged-in user
router.get('/f/purchased-test-series', authenticateUser, testSeriesController.getPurchasedTestSeries);

// Route to check if a specific test series has been purchased
router.get('/:testSeriesId/purchase-status', authenticateUser, testSeriesController.checkTestSeriesPurchaseStatus);
// Function to update test statuses directly using a more efficient method
router.get('/f/my-test-series', authenticateUser,isInstructor, testSeriesController.getMyTestSeries);



module.exports = router;
