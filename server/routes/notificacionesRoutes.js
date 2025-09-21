// server/routes/notificacionesRoutes.js
const express = require('express');
const ctrl = require('../controllers/notificacionController');
const router = express.Router();

// Opcional: si tenés middleware de auth, lo insertás aquí
// const auth = require('../middleware/auth');
// router.use(auth);

router.get('/usuario/:usuarioId', ctrl.getPorUsuario);
router.get('/usuario/:usuarioId/no-leidas', ctrl.getNoLeidasPorUsuario);
router.patch('/:id/leido', ctrl.marcarComoLeida);
router.patch('/marcar-todas/:usuarioId', ctrl.marcarTodas);

module.exports = router;
