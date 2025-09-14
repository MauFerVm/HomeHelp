// routes/solicitudRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'solicitudes');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'solicitud-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Middleware para validar autenticación (puedes agregarlo después)
// const authMiddleware = require('../middleware/auth');

/**
 * @route GET /api/solicitudes/tipos-trabajo
 * @desc Obtiene los tipos de trabajo disponibles
 * @access Public (por ahora)
 */
router.get('/tipos-trabajo', solicitudController.getTiposTrabajo);

/**
 * @route GET /api/solicitudes/estados
 * @desc Obtiene los estados de solicitud disponibles
 * @access Public (por ahora)
 */
router.get('/estados', solicitudController.getEstadosSolicitud);

/**
 * @route POST /api/solicitudes
 * @desc Crea una nueva solicitud de servicio
 * @access Private (agregar middleware de autenticación después)
 */
router.post('/', upload.single('foto'), solicitudController.crearSolicitud);

/**
 * @route GET /api/solicitudes/cliente/:clienteId
 * @desc Obtiene todas las solicitudes de un cliente específico
 * @access Private
 */
router.get('/cliente/:clienteId', solicitudController.getSolicitudesByCliente);

/**
 * @route GET /api/solicitudes/:id
 * @desc Obtiene una solicitud específica con su historial
 * @access Private
 */
router.get('/:id', solicitudController.getSolicitudById);

/**
 * @route GET /api/solicitudes
 * @desc Obtiene todas las solicitudes (para administradores)
 * @access Private (solo admin)
 */
router.get('/', solicitudController.getAllSolicitudes);

module.exports = router;
