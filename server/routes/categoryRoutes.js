// routes/categoryRoutes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const {
  getActiveCategories,
  getAllCategories,
  getGestion,
  crearCategoria,
  modificarCategoria,
  cambiarEstadoCategoria
} = require('../controllers/categoryController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'categorias');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `categoria-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

const subirImagen = (req, res, next) => {
  upload.single('imagen')(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar los 5 MB'
      : (error.message || 'No se pudo subir la imagen');
    res.status(400).json({ success: false, message });
  });
};

router.get('/active', getActiveCategories);
router.get('/gestion', getGestion);
router.get('/', getAllCategories);
router.post('/', subirImagen, crearCategoria);
router.put('/:id', subirImagen, modificarCategoria);
router.patch('/:id/estado', cambiarEstadoCategoria);

module.exports = router;
