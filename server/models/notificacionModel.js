// server/models/notificacionModel.js
const db = require('../config/db'); // debe ser tu pool mysql2/promise

class Notificacion {
  constructor({ id = null, usuario_id, tipo_notificacion, referencia_id, mensaje, leido = 0, creado_en = null }) {
    this.id = id;
    this.usuario_id = usuario_id;
    this.tipo_notificacion = tipo_notificacion;
    this.referencia_id = referencia_id;
    this.mensaje = mensaje;
    this.leido = leido;
    this.creado_en = creado_en;
  }

  /**
   * crearNotificacion: inserta una notificación y devuelve la instancia creada
   * @param {{usuario_id: number, tipo_notificacion: string, referencia_id: number, mensaje: string}} datos
   * @returns {Promise<Notificacion>}
   */
  static async crearNotificacion({ usuario_id, tipo_notificacion, referencia_id, mensaje }) {
    const [result] = await db.query(
      'INSERT INTO notificacion (usuario_id, tipo_notificacion, referencia_id, mensaje) VALUES (?, ?, ?, ?)',
      [usuario_id, tipo_notificacion, referencia_id, mensaje]
    );
    return new Notificacion({ id: result.insertId, usuario_id, tipo_notificacion, referencia_id, mensaje, leido: 0 });
  }

  /**
   * crearMuchas: inserta muchas notificaciones en una única transacción.
   * payloads: array de { usuario_id, tipo_notificacion, referencia_id, mensaje }
   * @param {Array<Object>} payloads
   * @returns {Promise<number>} cantidad insertada
   */
  static async crearMuchas(payloads = []) {
    if (!Array.isArray(payloads) || payloads.length === 0) return 0;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const placeholders = [];
      const values = [];
      for (const p of payloads) {
        placeholders.push('(?, ?, ?, ?)');
        values.push(p.usuario_id, p.tipo_notificacion, p.referencia_id, p.mensaje);
      }

      const sql = `INSERT INTO notificacion (usuario_id, tipo_notificacion, referencia_id, mensaje) VALUES ${placeholders.join(', ')}`;
      const [res] = await conn.query(sql, values);

      await conn.commit();
      conn.release();

      // res.affectedRows suele indicar cuántas filas se insertaron
      return res.affectedRows || payloads.length;
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw err;
    }
  }

  /**
   * obtenerPorUsuario: devuelve array de Notificacion para un usuario
   * @param {number} usuarioId
   * @param {{soloNoLeidas?: boolean}} opts
   * @returns {Promise<Array<Notificacion>>}
   */
  static async obtenerPorUsuario(usuarioId, opts = {}) {
    const { soloNoLeidas = false } = opts;
    const sql = soloNoLeidas
      ? 'SELECT * FROM notificacion WHERE usuario_id = ? AND leido = 0 ORDER BY creado_en DESC'
      : 'SELECT * FROM notificacion WHERE usuario_id = ? ORDER BY creado_en DESC';
    const [rows] = await db.query(sql, [usuarioId]);
    return rows.map(r => new Notificacion(r));
  }

  /**
   * marcarComoLeida: marca una notificacion como leida por id
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async marcarComoLeida(id) {
    const [res] = await db.query('UPDATE notificacion SET leido = 1 WHERE id = ?', [id]);
    return (res.affectedRows || 0) > 0;
  }

  /**
   * marcarTodasLeidasParaUsuario: marca todas las notificaciones como leidas para un usuario
   * @param {number} usuarioId
   * @returns {Promise<boolean>}
   */
  static async marcarTodasLeidasParaUsuario(usuarioId) {
    const [res] = await db.query('UPDATE notificacion SET leido = 1 WHERE usuario_id = ?', [usuarioId]);
    return (res.affectedRows || 0) > 0;
  }
}

module.exports = Notificacion;
