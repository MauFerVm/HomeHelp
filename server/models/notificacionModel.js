// models/notificacionModel.js
const db = require('../config/db');
const { enviarCorreo, armarPresentacion, urlDestino } = require('../utils/mailer');

class Notificacion {
  constructor({ id = null, usuario_id, tipo_notificacion, referencia_id = null, mensaje, leido = 0, creado_en = new Date() }) {
    this.id = id;
    this.usuario_id = usuario_id;
    this.tipo_notificacion = tipo_notificacion;
    this.referencia_id = referencia_id;
    this.mensaje = mensaje;
    this.leido = leido;
    this.creado_en = creado_en;
  }

  /**
   * Crea una notificación. Si se pasa una conexión, se usa en transacción.
   */
  static async crear({ usuario_id, tipo_notificacion, referencia_id = null, mensaje, presentacion = null }, conn = null) {
    const executor = conn || db;
    const [result] = await executor.query(
      `INSERT INTO notificacion (usuario_id, tipo_notificacion, referencia_id, mensaje, leido, creado_en)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [usuario_id, tipo_notificacion, referencia_id, mensaje]
    );

    Notificacion.enviarPorCorreo(usuario_id, mensaje, presentacion).catch((error) => {
      console.error('No se pudo enviar la notificación por correo:', error.message);
    });

    return new Notificacion({ id: result.insertId, usuario_id, tipo_notificacion, referencia_id, mensaje, leido: 0, creado_en: new Date() });
  }

  /**
   * Envía el aviso por correo. El botón del mail solo abre una pantalla de HomeHelp.
   */
  static async enviarPorCorreo(usuarioId, mensaje, presentacion = null) {
    const [rows] = await db.query(
      'SELECT correo FROM usuario WHERE id = ? LIMIT 1',
      [usuarioId]
    );
    const correo = rows[0] && rows[0].correo;
    if (!correo) {
      console.warn(`El usuario ${usuarioId} no tiene correo. No se envió la notificación por mail.`);
      return;
    }

    const tieneDestino = presentacion
      && presentacion.asunto
      && presentacion.titulo
      && presentacion.botonTexto
      && presentacion.seccion;

    if (!tieneDestino) {
      await enviarCorreo({
        to: correo,
        subject: 'HomeHelp - Nueva notificación',
        text: mensaje
      });
      return;
    }

    const url = urlDestino(presentacion.seccion);
    const { text, html } = armarPresentacion({
      titulo: presentacion.titulo,
      introduccion: presentacion.introduccion || mensaje,
      detalles: presentacion.detalles,
      nota: presentacion.nota,
      botonTexto: presentacion.botonTexto,
      url
    });

    await enviarCorreo({
      to: correo,
      subject: presentacion.asunto,
      text,
      html
    });
  }

  static async getByUsuario(usuarioId) {
    const [rows] = await db.query(
      `SELECT id, usuario_id, tipo_notificacion, referencia_id, mensaje, leido, creado_en
       FROM notificacion
       WHERE usuario_id = ?
       ORDER BY creado_en DESC`,
      [usuarioId]
    );
    return rows;
  }

  static async marcarLeida(id) {
    const [result] = await db.query(
      'UPDATE notificacion SET leido = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async marcarTodasLeidas(usuarioId) {
    const [result] = await db.query(
      'UPDATE notificacion SET leido = 1 WHERE usuario_id = ?',
      [usuarioId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Notificacion;


