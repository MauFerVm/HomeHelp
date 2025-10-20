// routes/horarioRoutes.js
const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');

/**
 * @route GET /api/horarios/profesional/:profesionalId/disponibles
 * @desc Obtener horarios disponibles de un profesional para una semana
 * @access Private
 * @query fechaInicio - Fecha de inicio de la semana (YYYY-MM-DD)
 * @query duracion - Duración en minutos del trabajo
 */
router.get('/profesional/:profesionalId/disponibles', horarioController.getHorariosDisponibles);

/**
 * @route POST /api/horarios/presupuesto/:presupuestoId/confirmar
 * @desc Confirmar horario seleccionado para un presupuesto
 * @access Private
 * @body { fecha, horaInicio, horaFin }
 */
router.post('/presupuesto/:presupuestoId/confirmar', horarioController.confirmarHorario);

module.exports = router;


