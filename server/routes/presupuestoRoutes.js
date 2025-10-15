// routes/presupuestoRoutes.js
const express = require('express');
const router = express.Router();
const presupuestoController = require('../controllers/presupuestoController');

/**
 * @route POST /api/presupuestos
 * @desc Crear un nuevo presupuesto
 * @access Private
 */
router.post('/', presupuestoController.crearPresupuesto);

/**
 * @route GET /api/presupuestos/solicitud/:solicitudId
 * @desc Obtener presupuestos por solicitud
 * @access Private
 */
router.get('/solicitud/:solicitudId', presupuestoController.getPresupuestosBySolicitud);

/**
 * @route GET /api/presupuestos/profesional/:profesionalId
 * @desc Obtener presupuestos por profesional
 * @access Private
 */
router.get('/profesional/:profesionalId', presupuestoController.getPresupuestosByProfesional);

/**
 * @route PUT /api/presupuestos/:presupuestoId/estado
 * @desc Actualizar estado de presupuesto
 * @access Private
 */
router.put('/:presupuestoId/estado', presupuestoController.actualizarEstadoPresupuesto);

/**
 * @route GET /api/presupuestos/verificar/:solicitudId/:profesionalId
 * @desc Verificar si un profesional ya presupuestó una solicitud específica
 * @access Private
 */
router.get('/verificar/:solicitudId/:profesionalId', presupuestoController.verificarPresupuestoExistente);

module.exports = router;
