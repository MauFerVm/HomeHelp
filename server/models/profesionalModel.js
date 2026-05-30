// server/models/profesionalModel.js
const db = require('../config/db');

class Profesional {
  constructor({ id, presentacion = null, instituto = null, foto_titulo = null, localidad_id, tipo_profesional_ids = [] }) {
    this.id = id;
    this.presentacion = presentacion;
    this.instituto = instituto;
    this.foto_titulo = foto_titulo;
    this.localidad_id = localidad_id;
    this.tipo_profesional_ids = tipo_profesional_ids;
  }

  /**
   * crear: inserta un registro en profesional y sus tipos en profesional_tipo
   * @param {{ id: number, presentacion?: string, instituto?: string, foto_titulo?: string, localidad_id: number, tipo_profesional_ids: number[] }} data
   * @param {any} [conn] - conexión opcional para transacción
   */
  static async crear(data, conn = null) {
    const executor = conn || db;
    const {
      id, presentacion = null, instituto = null, foto_titulo = null,
      localidad_id, tipo_profesional_ids = []
    } = data;

    await executor.query(
      `INSERT INTO profesional
         (id, presentacion, instituto, foto_titulo, localidad_id)
       VALUES (?, ?, ?, ?, ?)`,
      [id, presentacion, instituto, foto_titulo, localidad_id]
    );

    for (const tipoId of tipo_profesional_ids) {
      await executor.query(
        'INSERT INTO profesional_tipo (profesional_id, tipo_profesional_id) VALUES (?, ?)',
        [id, tipoId]
      );
    }

    return new Profesional(data);
  }
}

module.exports = Profesional;
