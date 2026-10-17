const express = require('express');
const router = express.Router();
const {
    getUsuarios,
    getClientes,
    getProfesionales,
    cambiarEstado,
    modificarUsuario,
    getEstadisticasGenerales,
    getReporteIngresos,
    getAnalisisUsuarios
} = require('../controllers/adminController');

router.get('/estadisticas-generales', getEstadisticasGenerales);
router.get('/reporte-ingresos', getReporteIngresos);
router.get('/analisis-usuarios', getAnalisisUsuarios);
router.get('/usuarios', getUsuarios);
router.get('/clientes', getClientes);
router.get('/profesionales', getProfesionales);
router.patch('/usuarios/:id/estado', cambiarEstado);
router.put('/usuarios/:id', modificarUsuario);

module.exports = router;
