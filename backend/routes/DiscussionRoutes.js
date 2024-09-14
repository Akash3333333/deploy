const express = require('express');
const router = express.Router();
const { authenticateUser, isStudent } = require('../config/authMiddleware');
const discussionController = require('../controllers/discussionController');

// Routes for main threads
router.post('/mainThread/getAll',authenticateUser,  discussionController.getAllThread);
router.post('/mainThread/create', authenticateUser, discussionController.createMainThread);
router.get('/mainThread/:threadId',authenticateUser, discussionController.getMainThread);
router.put('/mainThread/:threadId', authenticateUser, discussionController.updateMainThread);
router.put('/mainThread/:threadId/upvote', authenticateUser, discussionController.upvoteMainThread);
router.put('/mainThread/:threadId/downvote', authenticateUser, discussionController.downvoteMainThread);

router.delete('/mainThread/:threadId', authenticateUser, discussionController.deleteMainThread);

// Routes for comments
router.post('/comment/:threadId', authenticateUser, discussionController.createComment);
router.post('/reply/:commentId/:threadId', authenticateUser, discussionController.replyToComment);
router.get('/comment/:commentId',authenticateUser, discussionController.getComment);
router.put('/comment/:commentId', authenticateUser, discussionController.updateComment);
router.delete('/comment/:commentId/:threadId', authenticateUser, discussionController.deleteComment);
router.put('/comment/:commentId/upvote', authenticateUser,  discussionController.upvoteComment);
router.put('/comment/:commentId/downvote', authenticateUser,  discussionController.downvoteComment);

module.exports = router;
