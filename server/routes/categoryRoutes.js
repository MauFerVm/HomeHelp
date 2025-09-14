// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { getActiveCategories, getAllCategories } = require('../controllers/categoryController');

// GET /api/categories/active - Obtener solo categorías activas
router.get('/active', getActiveCategories);

// GET /api/categories - Obtener todas las categorías
router.get('/', getAllCategories);

module.exports = router;
