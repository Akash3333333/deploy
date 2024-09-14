// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const testRoutes = require('./routes/testRoutes'); // Import test routes
const testSeriesRoutes = require('./routes/testSeriesRoutes'); // Import test series routes
const categoryRoutes = require('./routes/categoryRoutes'); // Import test series routes
const DiscussionRoutes = require('./routes/DiscussionRoutes'); // Import test series routesDiscussionRoutes

const { authenticateUser } = require('./config/authMiddleware');
const mongoose = require('mongoose');
const path = require('path');


const User = require("./models/User");
const Course = require("./models/Course");
const Profile = require("./models/Profile");

const app = express();

// Enable all CORS requests
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;

// Connect to MongoDB
DB.connect();

// Middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/test', testRoutes); // Use test routes
app.use('/api/testSeries', testSeriesRoutes); // Use test series routes
app.use('/api/discuss', DiscussionRoutes); // Use test routes


// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
