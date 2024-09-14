const MainThread = require('../models/MainThread');
const Comment = require('../models/Comment');

// Create a main thread
exports.createMainThread = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const createdBy = req.user.id;
    const newThread = new MainThread({ title, description, category, createdBy });
    await newThread.save();
    res.status(201).json(newThread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get all main threads
exports.getAllThread = async (req, res) => {
  try {
    const threads = await MainThread.find();
    res.status(200).json(threads);
  } catch (error) {
    console.error('Error fetching all threads:', error);
    res.status(500).json({ message: 'Server error while fetching threads' });
  }
};

// Get a main thread by ID
exports.getMainThread = async (req, res) => {
  try {
    const thread = await MainThread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    res.json(thread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update a main thread by ID
exports.updateMainThread = async (req, res) => {
  try {
    const { title, description } = req.body;
    let thread = await MainThread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Check if the user is authorized to update this thread
    if (thread.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    thread.title = title;
    thread.description = description;
    await thread.save();
    res.json(thread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete a main thread by ID

exports.deleteMainThread = async (req, res) => {
  try {
    const thread = await MainThread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Check if the user is authorized to delete this thread
    if (thread.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // If authorized, delete the thread
    await MainThread.findByIdAndDelete(req.params.threadId);

    res.json({ message: 'Thread deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Upvote a main thread
exports.upvoteMainThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const mainThread = await MainThread.findById(threadId);

    // Check if the user has already upvoted this main thread
    if (mainThread.upvotes.includes(req.user.id)) {
      // If yes, remove the upvote
      mainThread.upvotes.pull(req.user.id);
    } else {
      // If not, remove the downvote if exists and add the upvote
      mainThread.downvotes.pull(req.user.id);
      mainThread.upvotes.addToSet(req.user.id);
    }

    await mainThread.save();
    res.json(mainThread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Downvote a main thread
exports.downvoteMainThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const mainThread = await MainThread.findById(threadId);

    // Check if the user has already downvoted this main thread
    if (mainThread.downvotes.includes(req.user.id)) {
      // If yes, remove the downvote
      mainThread.downvotes.pull(req.user.id);
    } else {
      // If not, remove the upvote if exists and add the downvote
      mainThread.upvotes.pull(req.user.id);
      mainThread.downvotes.addToSet(req.user.id);
    }

    await mainThread.save();
    res.json(mainThread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// Create a comment for a main thread
exports.createComment = async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;

  try {
    const mainThread = await MainThread.findById(threadId);
    if (!mainThread) {
      return res.status(404).json({ error: 'MainThread not found' });
    }

    const createdBy = req.user.id; // Assuming req.user contains authenticated user details

    const newComment = new Comment({
      mainThread: threadId,
      content,
      createdBy,
    });

    await newComment.save();

    // Update mainThread with the new comment
    mainThread.comments.push(newComment._id);
    await mainThread.save();

    res.status(201).json(newComment._id);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
  const { threadId, commentId } = req.params;
  const { content } = req.body;

  try {
    const mainThread = await MainThread.findById(threadId);
    if (!mainThread) {
      return res.status(404).json({ error: 'MainThread not found' });
    }

    // Ensure the parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    const createdBy = req.user.id; // Assuming req.user contains authenticated user details

    const newComment = new Comment({
      mainThread: threadId,
      content,
      parentComment: commentId,
      createdBy,
    });

    await newComment.save();

    // Update parent comment with the new reply
    parentComment.replies.push(newComment._id);
    await parentComment.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({ error: 'Failed to reply to comment' });
  }
};

// Get a comment by ID
exports.getComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
};

// Update a comment by ID
exports.updateComment = async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user is authorized to update this comment
    if (comment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true });
    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete a comment by ID
exports.deleteComment = async (req, res) => {
  const { commentId, threadId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user is authorized to delete this comment
    if (comment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Comment.findByIdAndDelete(commentId);

    // Remove comment ID from parent's replies array, if it's a reply
    if (comment.parentComment) {
      const parentComment = await Comment.findById(comment.parentComment);
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(id => id.toString() !== commentId);
        await parentComment.save();
      }
    } else {
      // If parentComment is null, remove comment ID from MainThread's comments array
      const mainThread = await MainThread.findById(threadId);
      if (mainThread) {
        mainThread.comments = mainThread.comments.filter(id => id.toString() !== commentId);
        await mainThread.save();
      }
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};


// Upvote a comment or reply
exports.upvoteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user has already upvoted this comment or reply
    if (comment.upvotes.includes(req.user.id)) {
      // If yes, remove the upvote
      comment.upvotes.pull(req.user.id);
    } else {
      // If not, remove the downvote if exists and add the upvote
      comment.downvotes.pull(req.user.id); // Remove from downvotes if exists
      comment.upvotes.addToSet(req.user.id); // Add to upvotes
    }

    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error('Error upvoting comment:', err);
    res.status(500).send('Server Error');
  }
};

// Downvote a comment or reply
exports.downvoteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user has already downvoted this comment or reply
    if (comment.downvotes.includes(req.user.id)) {
      // If yes, remove the downvote
      comment.downvotes.pull(req.user.id);
    } else {
      // If not, remove the upvote if exists and add the downvote
      comment.upvotes.pull(req.user.id); // Remove from upvotes if exists
      comment.downvotes.addToSet(req.user.id); // Add to downvotes
    }

    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error('Error downvoting comment:', err);
    res.status(500).send('Server Error');
  }
};

