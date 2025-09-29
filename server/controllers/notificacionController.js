// controllers/notificacionController.js
const Notificacion = require('../models/notificacionModel');

const getByUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const data = await Notificacion.getByUsuario(usuario_id);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getByUsuario:', error);
    res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
};

const marcarLeido = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await Notificacion.marcarLeida(id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Error marcarLeido:', error);
    res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
};

const marcarTodas = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const ok = await Notificacion.marcarTodasLeidas(usuario_id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Error marcarTodas:', error);
    res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
};

module.exports = { getByUsuario, marcarLeido, marcarTodas };


