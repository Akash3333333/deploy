const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isInstructor, authenticateUser, isStudent } = require('../config/authMiddleware');


router.get('/instructors', authenticateUser,dashboardController.getInstructors);


router.put('/updateProfile',authenticateUser, dashboardController.updateProfile);

router.get('/getProfile',authenticateUser, dashboardController.getProfile);

router.get('/getRole',authenticateUser,dashboardController.getRole);

module.exports = router;
