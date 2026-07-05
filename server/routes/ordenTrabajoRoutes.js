// routes/ordenTrabajoRoutes.js
const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');

/**
 * @route GET /api/ordenes/:ordenId
 * @desc Obtener orden de trabajo por ID
 * @access Private
 */
router.get('/:ordenId', ordenTrabajoController.getOrdenTrabajoById);

/**
 * @route GET /api/ordenes/profesional/:profesionalId
 * @desc Obtener órdenes de trabajo de un profesional
 * @access Private
 */
router.get('/profesional/:profesionalId', ordenTrabajoController.getOrdenesByProfesional);

/**
 * @route GET /api/ordenes/cliente/:clienteId
 * @desc Obtener órdenes de trabajo de un cliente
 * @access Private
 */
router.get('/cliente/:clienteId', ordenTrabajoController.getOrdenesByCliente);

/**
 * @route PUT /api/ordenes/:ordenId/estado
 * @desc Actualizar estado de una orden de trabajo
 * @access Private
 */
router.put('/:ordenId/estado', ordenTrabajoController.actualizarEstadoOrden);

/**
 * @route PUT /api/ordenes/:ordenId/reprogramar
 * @desc Reprogramar horario de una orden de trabajo (cliente)
 * @access Private
 */
router.put('/:ordenId/reprogramar', ordenTrabajoController.reprogramarHorarioOrden);

/**
 * @route PUT /api/ordenes/:ordenId/cancelar
 * @desc Cancelar orden de trabajo (profesional, con 48hs de anticipación)
 * @access Private
 */
router.put('/:ordenId/cancelar', ordenTrabajoController.cancelarOrdenProfesional);

/**
 * @route GET /api/ordenes/:ordenId/historial
 * @desc Obtener historial de cambios de estado de una orden
 * @access Private
 */
router.get('/:ordenId/historial', ordenTrabajoController.getHistorialOrden);

module.exports = router;


