const Test = require('../models/Test');
const Response = require('../models/Response');

exports.createTest = async (req, res) => {

    const { title, description,  questions } = req.body;

    // Validate input fields
    if (!title ||  !questions || questions.length === 0) {
        return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Calculate duration in minutes

    try {
        // Create new Test object using Mongoose model
        const newTest = new Test({
            title,
            description,
            questions,
            createdBy: req.user.id // Assuming you're using user authentication
        });

        // Save the test to the database
        const savedTest = await newTest.save();

        // Respond with the saved test object
        res.status(201).json(savedTest);
    } catch (error) {
        console.error('Error creating test:', error);
        res.status(500).json({ message: "Failed to create test." });
    }
};

// controllers/testController.js
exports.updateTestDates = async (req, res) => {
    const { testId } = req.params;
    const { startTime, endTime } = req.body;
  
    try {
      const test = await Test.findByIdAndUpdate(
        testId,
        { startTime, endTime },
        { new: true }
      );
  
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
  
      res.status(200).json({ message: "Test dates updated successfully", test });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
  

exports.getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Test not found." });
        }
        res.json(test);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get test." });
    }
};

exports.getAllTestsCreatedByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const tests = await Test.find({ createdBy: userId });
        res.status(200).json({ tests: tests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.deleteTest = async (req, res) => {
    try {
        const testId = req.params.testId;
        const test = await Test.findOne({ _id: testId, createdBy: req.user.id });
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        await Question.deleteMany({ _id: { $in: test.questions } });
        await test.remove();

        res.json({ message: 'Test deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};




exports.startResumeTest = async (req, res) => {
    const { testId } = req.params;
    const userId = req.user.id;

    try {
        // Find the test
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found.' });
        }

        // Check if the current time is within the test period
        const now = new Date();
        if (now < test.startTime) {
            return res.status(400).json({ error: 'Test has not started yet.' });
        }
        if (now > test.endTime) {
            return res.status(400).json({ error: 'Test has already ended.' });
        }

        // Find or create a new test session
        let session = await Response.findOne({ student: userId, test: testId });

        if (!session) {
            session = new Response({
                student: userId,
                test: testId,
                status: 'in-progress',
                startTime: now
            });
            await session.save();
        } else if (session.status === 'completed') {
            return res.status(400).json({ error: 'Test has already been completed.' });
        }

        res.json({
            message: 'Test session started/resumed successfully.',
            session,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const calculateScore = async (testId, answers) => {
    let score = 0;

    try {
        const test = await Test.findById(testId);

        if (!test) {
            throw new Error('Test not found');
        }

        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            const question = test.questions.id(answer.question); // Find question by its embedded ID

            if (question && answer.answer === question.correctAnswer) {
                answer.markAwarded = question.marks;
                score += question.marks;
            } else {
                answer.markAwarded = 0;
            }
        }
    } catch (error) {
        console.error('Error calculating score:', error.message);
    }

    return score;
};


exports.submitTest = async (req, res) => {
    const { testId } = req.params;
    const {  answers } = req.body;
    const userId=req.user.id;
    try {
        // Find the test session for the user
        let session = await Response.findOne({ student: userId, test: testId, status: 'in-progress' });
        if (!session) {
            return res.status(400).json({ error: 'No in-progress test session found.' });
        }

        // Check if the test is still within the allowed period
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ error: 'Test not found.' });
        }

        const now = new Date();
        if (now < test.startTime) {
            return res.status(400).json({ error: 'Test has not started yet.' });
        }
        if (now > test.endTime) {
            return res.status(400).json({ error: 'Test has already ended.' });
        }

        // Check if the test has already been submitted
        if (session.status === 'completed') {
            return res.status(400).json({ error: 'Test has already been submitted.' });
        }

        // Calculate the time taken as the difference between now and the start time
        const timeTaken = Math.floor((now - session.startTime) / 1000); // time in seconds
        const score = await calculateScore(testId, answers);

        session.answers = answers;
        session.score = score;
        session.timeTaken = timeTaken;
        session.submittedAt = now;
        session.status = 'completed';

        await session.save();

        res.json({ message: 'Test submitted successfully', score, timeTaken });


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// exports.saveProgress = async (req, res) => {
//     const { testId, answers } = req.body;
//     const userId=req.user.id
//     try {
//         // Find the test
//         const test = await Test.findById(testId);
//         if (!test) {
//             return res.status(404).json({ error: 'Test not found.' });
//         }

//         // Check if the current time is within the test period
//         const now = new Date();
//         if (now < test.startTime) {
//             return res.status(400).json({ error: 'Test has not started yet.' });
//         }
//         if (now > test.endTime) {
//             return res.status(400).json({ error: 'Test has already ended.' });
//         }

//         // Find or create a test session
//         let session = await Response.findOne({ student: userId, test: testId });

//         if (!session) {
//             session = new Response({
//                 student: userId,
//                 test: testId,
//                 status: 'in-progress',
//                 startTime: now
//             });
//         }

//         // Update session progress
//         session.answers = answers;
//         await session.save();

//         res.json({
//             message: 'Progress saved successfully.'
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };




exports.getTestResult = async (req, res) => {
    try {
        const testId = req.params.testId;
        const userId = req.user.id;

        // Find the response for the given testId and userId
        const response = await Response.findOne({ test: testId, student: userId })
            .populate({
                path: 'student',
                select: 'firstName lastName'
            })
            .populate({
                path: 'test',
                select: 'title'
            });

        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        res.status(200).json(response );
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};



// Leaderboard function
exports.getLeaderboard = async (req, res) => {
    try {
        const { testId } = req.params;

        // Fetch the test and check its status
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        if (test.status !== 'completed') {
            return res.status(403).json({ message: 'Leaderboard can only be generated after the test is completed' });
        }

        // Fetch responses for the test, populate necessary fields, and sort by score and time taken
        const responses = await Response.find({ test: testId })
            .populate('student', 'firstName lastName')  // Populate student's firstName and lastName
            .populate('test', 'title')  // Populate test title
            .sort({ score: -1, timeTaken: 1 });  // Sort by score in descending order and time taken in ascending order

        const leaderboard = responses.map((response, index) => ({
            rank: index + 1,
            studentName: `${response.student.firstName} ${response.student.lastName}`,
            score: response.score,
            timeTaken: response.timeTaken,
        }));

        res.json({ testTitle: responses[0]?.test.title || 'Test', leaderboard });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// exports.startTest = async (req, res) => {
//     const { testId } = req.params;
//     const userId = req.user.id;

//     try {
//         const test = await Test.findById(testId);

//         if (!test) {
//             return res.status(404).json({ message: 'Test not found' });
//         }

//         if (test.status !== 'scheduled') {
//             return res.status(403).json({ message: 'Test cannot be started' });
//         }

//         const currentTime = new Date();

//         if (test.startTime > currentTime) {
//             return res.status(403).json({ message: 'Test has not started yet' });
//         }

//         test.status = 'live';
//         await test.save();

//         // Create a new response entry with the start time
//         const response = new Response({
//             test: testId,
//             student: userId,
//             submittedAt: currentTime
//         });

//         await response.save();

//         res.json({ message: 'Test started successfully', responseId: response._id });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

//..
//exports.submitTest = async (req, res) => {
//     const { testId } = req.params;
//     const { answers, startTime } = req.body; // Include startTime from req.body

//     try {
//         const test = await Test.findById(testId);

//         if (!test) {
//             return res.status(404).json({ message: 'Test not found' });
//         }

//         if (test.status !== 'live') {
//             return res.status(403).json({ message: 'Test is not currently live' });
//         }

//         const currentTime = new Date();

//         if (test.endTime < currentTime) {
//             return res.status(403).json({ message: 'Test has ended, submission not allowed' });
//         }

//         const response = await Response.findOne({ test: testId, student: req.user.id });

//         if (!response) {
//             return res.status(404).json({ message: 'Test not started or invalid test ID' });
//         }

//         // Calculate time taken
//         const endTime = new Date();
//         const timeTaken = Math.floor((currentTime - new Date(startTime)) / 1000); // Calculate time taken in seconds

//         const score = await calculateScore(testId, answers);

//         response.answers = answers;
//         response.score = score;
//         response.submittedAt = currentTime;
//         response.timeTaken = timeTaken; // Save time taken

//         await response.save();

//         test.status = 'completed';
//         await test.save();

//         res.json({ message: 'Test submitted successfully', score, timeTaken });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

