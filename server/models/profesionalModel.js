// server/models/profesionalModel.js
const db = require('../config/db');

class Profesional {
  constructor({ id, presentacion = null, instituto = null, foto_titulo = null, tipo_profesional_id, localidad_id }) {
    this.id = id;
    this.presentacion = presentacion;
    this.instituto = instituto;
    this.foto_titulo = foto_titulo;
    this.tipo_profesional_id = tipo_profesional_id;
    this.localidad_id = localidad_id;
  }

  /**
   * crear: inserta un registro en profesional
   * @param {{ id: number, presentacion?: string, instituto?: string, foto_titulo?: string, tipo_profesional_id: number, localidad_id: number }} data
   * @param {any} [conn] - conexión opcional para transacción
   */
  static async crear(data, conn = null) {
    const executor = conn || db;
    const {
      id, presentacion = null, instituto = null, foto_titulo = null,
      tipo_profesional_id, localidad_id
    } = data;

    await executor.query(
      `INSERT INTO profesional
         (id, presentacion, instituto, foto_titulo, tipo_profesional_id, localidad_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, presentacion, instituto, foto_titulo, tipo_profesional_id, localidad_id]
    );
    return new Profesional(data);
  }
}

module.exports = Profesional;
