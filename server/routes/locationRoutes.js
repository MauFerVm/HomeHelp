// server/routes/locationRoutes.js
const express = require('express');
const router = express.Router();              // ← Aquí defines router
const locationController = require('../controllers/locationController');

// Rutas de ubicación
router.get('/provincias', locationController.listarProvincias);
router.get('/localidades/:provinciaId', locationController.listarLocalidades);
router.get('/tipos-profesional', locationController.listarTiposProfesional);

module.exports = router;                      // ← Y aquí lo exportas
