const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes'); // <— importa tu nuevo router
const categoryRoutes = require('./routes/categoryRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const presupuestoRoutes = require('./routes/presupuestoRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const ordenTrabajoRoutes = require('./routes/ordenTrabajoRoutes');

const app = express();
app.use(cors());
app.use(express.json());


// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public', 'uploads', 'solicitudes');
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

// Servir imágenes estáticas
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'public', 'uploads'))
);

//rutas
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);   // <— monta los endpoints /provincias, etc.
app.use('/api/categories', categoryRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/presupuestos', presupuestoRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/ordenes', ordenTrabajoRoutes);



// Middleware de manejo de errores global
/*app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor', 
    message: err.message 
  });
});

// Middleware para rutas no encontradas
app.use('/', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada', 
    message: `La ruta ${req.originalUrl} no existe` 
  });
});*/


app.listen(3002, () => console.log('Server running on http://localhost:3002'));