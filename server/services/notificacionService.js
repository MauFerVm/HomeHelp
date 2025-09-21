// server/services/notificacionService.js
const Notificacion = require('../models/notificacionModel');

/**
 * Crear notificaciones para una acción (p. ej. solicitud).
 * @param {Object} options
 *   - solicitud: { id, titulo, descripcion }  (opcional, para referencia)
 *   - destinatarios: Array<{ usuario_id: number }>
 *   - mensaje: string (si ya lo formateaste). Si no se envía, se usará un mensaje genérico.
 *   - tipo_notificacion: string (p.ej. 'solicitud')
 *
 * Retorna la cantidad de notificaciones creadas.
 */
async function crearNotificaciones({ solicitud = {}, destinatarios = [], mensaje = null, tipo_notificacion = 'solicitud' }) {
  if (!Array.isArray(destinatarios) || destinatarios.length === 0) return 0;

  const titulo = (solicitud.titulo || '').trim();
  const resumen = (solicitud.descripcion || '').trim().slice(0, 120);

  // Si no mandaron mensaje, generamos uno simple (aunque preferimos que el controller lo pase ya formateado)
  const baseMsg = mensaje || `${titulo ? titulo + ' — ' : ''}${resumen ? resumen : 'Nueva solicitud disponible.'}`;

  const payloads = destinatarios.map(d => ({
    usuario_id: d.usuario_id,
    tipo_notificacion,
    referencia_id: solicitud.id || null,
    mensaje: baseMsg
  }));

  // delegar al modelo para la inserción en BD
  const created = await Notificacion.crearMuchas(payloads);
  return created;
}

module.exports = {
  crearNotificaciones
};
