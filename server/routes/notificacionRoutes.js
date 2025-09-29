// routes/notificacionRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificacionController');

// GET /api/notificaciones/usuario/:usuario_id
router.get('/usuario/:usuario_id', ctrl.getByUsuario);

// PATCH /api/notificaciones/:id/leido
router.patch('/:id/leido', ctrl.marcarLeido);

// PATCH /api/notificaciones/marcar-todas/:usuario_id
router.patch('/marcar-todas/:usuario_id', ctrl.marcarTodas);

module.exports = router;


