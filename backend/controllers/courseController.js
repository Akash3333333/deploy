const Course = require('../models/Course');
const User = require("../models/User");
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configure multer if needed
const cloudinary = require('../config/cloudinary');



exports.createCourse = async (req, res) => {
        try {
        const { title, description, category, price, tags } = req.body;
    console.log(req.file);
        // Upload thumbnail to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'course_thumbnails',
            use_filename: true,
        });
    
        // Get the URL of the uploaded thumbnail
        const thumbnailUrl = result.secure_url;
    
        // Create new course object
        const newCourse = new Course({
            title,
            description,
            category,
            price,
            tags,
            thumbnail: thumbnailUrl,
            instructor: req.user.id // Assuming you have authentication middleware setting req.user.id
        });
    
        // Save course to database

        const savedCourse = await newCourse.save();

        const user = await User.findById(req.user.id);
        user.courses.push(savedCourse._id);
        await user.save();
        res.status(201).json(savedCourse);
    
        // Cleanup: remove the temporary file
        fs.unlinkSync(req.file.path);
        } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Course creation failed' });
        }
};


exports.uploadLectures = async (req, res) => {
    const { courseId } = req.params;
    const lectures = req.body;
    console.log(lectures);
  
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Loop through the uploaded lectures
      for (let i = 0; i < lectures.length; i++) {
        const { title, description } = lectures[i];
        const video = req.files[`video${i}`][0];
  
        // Upload video to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              public_id: `lectures/${courseId}/${title}`
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(video.buffer);
        });
  
        // Add the lecture to the course
        course.lectures.push({
          title,
          description,
          video: result.secure_url
        });
      }
  
      await course.save();
      res.status(200).json({ message: 'Lectures uploaded successfully', course });
    } catch (error) {
      console.error('Error uploading lectures:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

// Get all courses
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'firstName lastName');
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getCoursesByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId; // Assuming categoryId is passed as a parameter

        // Query to find courses based on category ID
        const courses = await Course.find({ category: categoryId })
            .populate('instructor', 'name') // Populate instructor with 'name' field
            .populate('category', 'name'); // Populate category with 'name' field

        // Check if courses are found
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No courses found for this category' });
        }

        // Return courses as JSON response
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses by category:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get a specific course by ID
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};







exports.getMyCourses = async (req, res) => {
    try {
        // Get the user ID from the authenticated request (assumed to be set in req.user)

        // Find the user by ID to get their enrolled course IDs
        const userId = req.user.id; // Assuming req.user contains user info
        // Find the user and populate the courses field
        const user = await User.findById(userId).populate('courses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the enrolled courses as a response
        res.json(user.courses);
    } catch (error) {
        console.error(error);
        
        res.status(500).json({ message: 'Server Error' });
    }
}






// Update a course by ID
exports.updateCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, description, thumbnail, content, category, price } = req.body;

        // Validate required fields
        if (!title || !description || !thumbnail || !category || !price) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const updatedCourse = {
            title,
            description,
            thumbnail,
            content,
            category,
            price,
        };

        const course = await Course.findByIdAndUpdate(courseId, updatedCourse, { new: true });

        // Update user's courses
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { courses: course._id } });

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Delete a course by ID
exports.deleteCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        // Remove course from user's courses
        await User.findByIdAndUpdate(req.user._id, { $pull: { courses: courseId } });

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};








exports.postReview = async (req, res) => {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id; // Assuming user ID is available in req.user from JWT token

    // Basic validation
    if (!rating) {
        return res.status(400).json({ message: 'Rating is required' });
    }

    try {

        
        // Find the course by ID

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Create a new review object
       
        const review = {
            user: userId,
            rating,
            comment
        };

        // Push the review into the reviews array
        course.reviews.push(review);

        // Save the updated course
        await course.save();

        res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Get all reviews for a specific course
exports.getAllReviews = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Find the course by ID and populate the reviews with user details
        const course = await Course.findById(courseId).populate('reviews.user', 'firstName lastName ',);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course.reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Get reviews by user ID and course ID
exports.getReviewsByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Find reviews for the course by the user
        const reviews = course.reviews.filter(review => String(review.user) === String(userId));

        if (!reviews.length) {
            return res.status(404).json({ message: 'No reviews found for this user and course' });
        }

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Update a review by user ID and course ID
exports.updateReviewByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;
        const { rating, comment } = req.body;

        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Find the review by user ID and course ID and update it
        const review = course.reviews.find(review => String(review.user) === String(userId));
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.rating = rating;
        review.comment = comment;
        await course.save();

        res.json({ message: 'Review updated successfully', review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get average review rating for a course by course ID
exports.getAverageRatingForCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Calculate the average rating
        const totalRating = course.reviews.reduce((acc, curr) => acc + curr.rating, 0);
        const averageRating = totalRating / course.reviews.length;

        res.json({ courseId: courseId, averageRating });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteReview = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id; // Assuming user ID is available in req.user from JWT token

    try {
        // Find the course by ID
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Filter out reviews by the specified user
        const initialReviewCount = course.reviews.length;
        course.reviews = course.reviews.filter(review => String(review.user) !== String(userId));

        // Check if any reviews were deleted
        if (course.reviews.length === initialReviewCount) {
            return res.status(404).json({ message: 'No reviews found for this user and course' });
        }

        // Save the updated course
        await course.save();

        res.json({ message: 'All reviews by the user have been deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


exports.buyCourse = async (req, res) => {
    try {
        const userId = req.user.id; // Current logged-in user ID (from auth middleware)
        const courseId = req.params.courseId; // Course ID from URL params

        // Fetch the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Fetch the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user has already enrolled in the course
        if (user.courses.includes(courseId)) {
            return res.status(400).json({ message: 'You have already enrolled in this course' });
        }

        // Add the course to the user's courses array
        user.courses.push(courseId);

        // Add the user to the course's studentsEnrolled array
        course.studentsEnrolled.push(userId);

        // Save both user and course
        await user.save();
        await course.save();

        res.status(200).json({ message: 'Course purchased successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getPurchasedCourses = async (req, res) => {
    try {
      const userId = req.user.id; // Extract user ID from the authenticated request
      const user = await User.findById(userId).populate('courses'); // Populate the courses field
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(user.courses); // Return the list of purchased courses
    } catch (error) {
      console.error('Error fetching purchased courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

exports.checkCoursePurchaseStatus = async (req, res) => {
    try {
      const userId = req.user.id; // Extract user ID from the authenticated request
      const { courseId } = req.params;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const purchased = user.courses.includes(courseId);
      res.json({ purchased });
    } catch (error) {
      console.error('Error checking course purchase status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };