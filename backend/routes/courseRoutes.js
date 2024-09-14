const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Course = require('../models/Course');

const { isInstructor, authenticateUser, isStudent } = require('../config/authMiddleware');
const upload = multer({ dest: 'uploads/' }); // Configure as needed

// Get all courses
router.get('/', courseController.getAllCourses);


// Get a specific course by ID
router.get('/:courseId', courseController.getCourseById);

//Get enrolled courses


// Create a new course
router.post('/create',authenticateUser,upload.single('thumbnail'), courseController.createCourse);
router.put('/upload-lectures/:courseId', upload.any(), async (req, res) => {
    const { courseId } = req.params;
    const lectures = req.files;

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Loop through the uploaded lectures and add them to the course
        for (const file of lectures) {
            const fieldName = file.fieldname; // Example: "video0"
            const index = fieldName.replace('video', ''); // Extract index from field name
            const title = req.body[`title${index}`];
            const description = req.body[`description${index}`] || '';

            const result = await cloudinary.uploader.upload(file.path, { resource_type: 'video' });

            const newLecture = {
                title: title || `Lecture ${parseInt(index, 10) + 1}`,
                description: description,
                video: result.secure_url, // Cloudinary URL
            };
            course.lectures.push(newLecture);
        }

        await course.save();

        res.status(200).json({ message: 'Lectures uploaded successfully', course });
    } catch (error) {
        console.error('Error uploading lectures:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/buy-course/:courseId', authenticateUser,isStudent, courseController.buyCourse);

router.get('/f/purchased-courses', authenticateUser, courseController.getPurchasedCourses);

router.get('/:courseId/purchase-status', authenticateUser, courseController.checkCoursePurchaseStatus);
router.get('/f/my-courses', authenticateUser,isInstructor, courseController.getMyCourses);

  

// Update a course by ID
router.put('/update/:id', authenticateUser,isInstructor, courseController.updateCourse);

// Delete a course by ID
router.delete('/delete/:id', authenticateUser,isInstructor, courseController.deleteCourse);




router.get('/:categoryId', authenticateUser,courseController.getCoursesByCategory);





router.post('/:courseId/postReview', authenticateUser,isStudent, courseController.postReview);


router.get('/:courseId/getAllReviews', authenticateUser ,isStudent, courseController.getAllReviews);


// Get reviews by user ID and course ID
router.get('/:courseId/getReview', authenticateUser ,isStudent, courseController.getReviewsByUser);

// Update a review by user ID and course ID
router.put('/:courseId/updateReview', authenticateUser,isStudent, courseController.updateReviewByUser);

router.get('/:courseId/averageRating', authenticateUser, courseController.getAverageRatingForCourse );

router.delete('/:courseId/deleteReview', authenticateUser,isStudent, courseController.deleteReview);

module.exports = router;
