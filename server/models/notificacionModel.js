// models/notificacionModel.js
const db = require('../config/db');

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
  static async crear({ usuario_id, tipo_notificacion, referencia_id = null, mensaje }, conn = null) {
    const executor = conn || db;
    const [result] = await executor.query(
      `INSERT INTO notificacion (usuario_id, tipo_notificacion, referencia_id, mensaje, leido, creado_en)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [usuario_id, tipo_notificacion, referencia_id, mensaje]
    );
    return new Notificacion({ id: result.insertId, usuario_id, tipo_notificacion, referencia_id, mensaje, leido: 0, creado_en: new Date() });
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


