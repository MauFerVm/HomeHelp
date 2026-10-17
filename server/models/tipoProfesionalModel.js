// models/tipoProfesionalModel.js
const db = require('../config/db');

class TipoProfesional {
  constructor({ id = null, nombre, estado, imagen = null }) {
    this.id = id;
    this.nombre = nombre;
    this.estado = estado;
    this.imagen = imagen;
  }

  /**
   * Trae todos los tipos de profesional
   * @returns {Promise<TipoProfesional[]>}
   */
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, nombre, estado, imagen FROM tipo_profesional ORDER BY nombre'
    );
    return rows.map(r => new TipoProfesional(r));
  }

  /**
   * Trae solo los tipos de profesional activos
   * @returns {Promise<TipoProfesional[]>}
   */
  static async getActive() {
    const [rows] = await db.query(
      'SELECT id, nombre, estado, imagen FROM tipo_profesional WHERE estado = 1 ORDER BY nombre'
    );
    return rows.map(r => new TipoProfesional(r));
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      estado: this.estado,
      imagen: this.imagen
    };
  }

  static async listarGestion() {
    const [rows] = await db.execute(`
      SELECT
        tp.id,
        tp.nombre,
        tp.estado,
        tp.imagen,
        (
          SELECT COUNT(DISTINCT pt.profesional_id)
          FROM profesional_tipo pt
          WHERE pt.tipo_profesional_id = tp.id
        ) AS profesionales,
        (
          SELECT COUNT(*)
          FROM solicitud_servicio ss
          WHERE ss.tipo_profesional_id = tp.id
        ) AS solicitudes
      FROM tipo_profesional tp
      ORDER BY tp.nombre ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      estado: Number(row.estado) === 1,
      imagen: row.imagen || null,
      profesionales: Number(row.profesionales) || 0,
      solicitudes: Number(row.solicitudes) || 0
    }));
  }

  static async nombreEnUso(nombre, excluirId = null) {
    const params = [nombre];
    let sql = 'SELECT id FROM tipo_profesional WHERE LOWER(nombre) = LOWER(?)';
    if (excluirId != null) {
      sql += ' AND id <> ?';
      params.push(excluirId);
    }
    const [rows] = await db.execute(sql, params);
    return rows.length > 0;
  }

  static async crear(nombre, imagen = null) {
    const [result] = await db.execute(
      'INSERT INTO tipo_profesional (nombre, estado, imagen) VALUES (?, 1, ?)',
      [nombre, imagen]
    );
    return {
      id: result.insertId,
      nombre,
      estado: true,
      imagen,
      profesionales: 0,
      solicitudes: 0
    };
  }

  static async actualizar(id, nombre, imagen = null) {
    let anterior = null;
    if (imagen) {
      const [rows] = await db.execute(
        'SELECT imagen FROM tipo_profesional WHERE id = ?',
        [id]
      );
      anterior = rows[0]?.imagen || null;
    }

    const params = imagen
      ? [nombre, imagen, id]
      : [nombre, id];
    const sql = imagen
      ? 'UPDATE tipo_profesional SET nombre = ?, imagen = ? WHERE id = ?'
      : 'UPDATE tipo_profesional SET nombre = ? WHERE id = ?';
    const [result] = await db.execute(sql, params);
    return { ok: result.affectedRows > 0, anterior };
  }

  static async actualizarEstado(id, estado) {
    const [result] = await db.execute(
      'UPDATE tipo_profesional SET estado = ? WHERE id = ?',
      [estado ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = TipoProfesional;
