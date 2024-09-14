const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require("../models/User");

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = decoded;
        
        next();
    });
};



// Middleware to check if user is a Student
const isStudent = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.role !== 'Student') {
            return res.status(403).json({ message: 'Access Denied. Students only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// Middleware to check if user is an Instructor
const isInstructor = async (req, res, next) => {
    
    const user = await User.findById(req.user.id);
    try {
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.role !== 'Instructor') {
            return res.status(403).json({ message: 'Access Denied. Instructors only.' });
        }
        next();
    } catch (error) {
        
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { authenticateUser, isStudent, isInstructor };
