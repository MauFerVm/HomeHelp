const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes'); // <— importa tu nuevo router

const app = express();
app.use(cors());
app.use(express.json());

// Servir imágenes estáticas
const path = require('path');
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'public', 'uploads'))
);

//rutas
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);   // <— monta los endpoints /provincias, etc.

app.listen(3002, () => console.log('Server running on http://localhost:3002'));