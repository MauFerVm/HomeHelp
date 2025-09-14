// controllers/categoryController.js
const TipoProfesional = require('../models/tipoProfesionalModel');

/**
 * Obtiene todas las categorías activas
 */
const getActiveCategories = async (req, res) => {
  try {
    const categories = await TipoProfesional.getActive();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene todas las categorías (activas e inactivas)
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await TipoProfesional.getAll();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener todas las categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getActiveCategories,
  getAllCategories
};
