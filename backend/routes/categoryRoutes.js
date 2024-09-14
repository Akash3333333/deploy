// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Create a new category
router.post('/create', categoryController.createCategory);

// Update a category by ID
router.put('/update/:id', categoryController.updateCategory);

// Delete a category by ID
router.delete('/delete/:id', categoryController.deleteCategory);

module.exports = router;
