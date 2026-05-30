// routes/calificacionesRoutes.js
const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');

/**
 * @route POST /api/calificaciones
 * @desc Crear una nueva calificación
 * @access Private
 */
router.post('/', calificacionesController.crearCalificacion);

/**
 * @route GET /api/calificaciones/verificar
 * @desc Verificar si existe una calificación
 * @access Private
 */
router.get('/verificar', calificacionesController.verificarCalificacion);

/**
 * @route GET /api/calificaciones/destacados
 * @desc Obtener profesionales destacados por calificación
 * @access Public
 */
router.get('/destacados', calificacionesController.getProfesionalesDestacados);

/**
 * @route GET /api/calificaciones/solicitud/:solicitud_id
 * @desc Obtener calificaciones por solicitud
 * @access Private
 */
router.get('/solicitud/:solicitud_id', calificacionesController.getCalificacionesBySolicitud);

/**
 * @route GET /api/calificaciones/persona/:persona_id
 * @desc Obtener calificaciones por persona
 * @access Private
 */
router.get('/persona/:persona_id', calificacionesController.getCalificacionesByPersona);

module.exports = router;

