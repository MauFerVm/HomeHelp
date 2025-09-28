// server/routes/authRoutes.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const authController = require('../controllers/authController');

const router = express.Router();

// Configuración de Multer con destinos dinámicos según el campo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = path.join(__dirname, '..', 'public', 'uploads');
    const folder = file.fieldname === 'foto_titulo'
      ? 'certificates'
      : 'profiles';
    cb(null, path.join(base, folder));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Ruta de registro completo:
// - recibe foto_perfil y foto_titulo (opcional para profesional)
router.post(
  '/register-completo',
  upload.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'foto_titulo',  maxCount: 1 }
  ]),
  authController.registerCompleto
);

// Login
router.post('/login', authController.login);

// Obtener datos completos del cliente
router.get('/cliente/:usuario_id', authController.getClienteData);

// Obtener datos de la persona por usuario_id
router.get('/persona/:usuario_id', authController.getPersonaByUsuarioId);

// Obtener datos completos del profesional
router.get('/profesional/:usuario_id', authController.getProfesionalData);

module.exports = router;
