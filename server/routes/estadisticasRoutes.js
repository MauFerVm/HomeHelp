// routes/estadisticasRoutes.js
const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticasController');

/**
 * @route GET /api/estadisticas/comparacion-presupuestos/:profesionalPersonaId
 * @desc Comparar presupuestos del profesional vs. ofertas ganadoras
 * @query periodo=1m|3m|6m|custom & desde & hasta (YYYY-MM-DD, solo custom)
 * @access Private
 */
router.get(
    '/comparacion-presupuestos/:profesionalPersonaId',
    estadisticasController.getComparacionPresupuestos
);

/**
 * @route GET /api/estadisticas/calificaciones/:profesionalPersonaId
 * @desc Promedio, distribución y últimas reseñas del profesional
 * @query periodo=1m|3m|6m|custom & desde & hasta (YYYY-MM-DD, solo custom)
 * @access Private
 */
router.get(
    '/calificaciones/:profesionalPersonaId',
    estadisticasController.getCalificacionesReputacion
);

/**
 * @route GET /api/estadisticas/ingresos/:profesionalPersonaId
 * @desc Ingresos cobrados agrupados por semana o mes
 * @query periodo=1m|3m|6m|custom & desde & hasta (YYYY-MM-DD, solo custom)
 * @access Private
 */
router.get(
    '/ingresos/:profesionalPersonaId',
    estadisticasController.getIngresosAcumulados
);

/**
 * @route GET /api/estadisticas/gastos/:clientePersonaId
 * @desc Gastos del cliente agrupados por semana o mes, con totales por rubro
 * @query periodo=1m|3m|6m|custom & desde & hasta (YYYY-MM-DD, solo custom) & tipo_profesional_id
 * @access Private
 */
router.get(
    '/gastos/:clientePersonaId',
    estadisticasController.getGastosCliente
);

/**
 * @route GET /api/estadisticas/solicitudes/:clientePersonaId
 * @desc Solicitudes publicadas, ofertas recibidas, sin oferta y tasa de contratación
 * @query periodo=1m|3m|6m|custom & desde & hasta (YYYY-MM-DD, solo custom)
 * @access Private
 */
router.get(
    '/solicitudes/:clientePersonaId',
    estadisticasController.getSolicitudesCliente
);

module.exports = router;
