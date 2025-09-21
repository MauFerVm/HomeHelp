// server/controllers/notificacionController.js
const Notificacion = require('../models/notificacionModel');

const getPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const notis = await Notificacion.obtenerPorUsuario(usuarioId);
    return res.json({ success: true, data: notis });
  } catch (err) {
    console.error('getPorUsuario error:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
  }
};

const getNoLeidasPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const notis = await Notificacion.obtenerPorUsuario(usuarioId, { soloNoLeidas: true });
    return res.json({ success: true, data: notis });
  } catch (err) {
    console.error('getNoLeidasPorUsuario error:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
  }
};

const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await Notificacion.marcarComoLeida(id);
    return res.json({ success: !!ok });
  } catch (err) {
    console.error('marcarComoLeida error:', err);
    return res.status(500).json({ success: false, message: 'Error al marcar notificación' });
  }
};

const marcarTodas = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const ok = await Notificacion.marcarTodasLeidasParaUsuario(usuarioId);
    return res.json({ success: !!ok });
  } catch (err) {
    console.error('marcarTodas error:', err);
    return res.status(500).json({ success: false, message: 'Error al marcar todas las notificaciones' });
  }
};

module.exports = {
  getPorUsuario,
  getNoLeidasPorUsuario,
  marcarComoLeida,
  marcarTodas
};
