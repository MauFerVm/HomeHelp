// models/tipoProfesionalModel.js
const db = require('../config/db');

class TipoProfesional {
  constructor({ id = null, nombre, estado }) {
    this.id = id;
    this.nombre = nombre;
    this.estado = estado;
  }

  /**
   * Trae todos los tipos de profesional
   * @returns {Promise<TipoProfesional[]>}
   */
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, nombre, estado FROM tipo_profesional ORDER BY nombre'
    );
    return rows.map(r => new TipoProfesional(r));
  }

  /**
   * Trae solo los tipos de profesional activos
   * @returns {Promise<TipoProfesional[]>}
   */
  static async getActive() {
    const [rows] = await db.query(
      'SELECT id, nombre, estado FROM tipo_profesional WHERE estado = 1 ORDER BY nombre'
    );
    return rows.map(r => new TipoProfesional(r));
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      estado: this.estado
    };
  }
}

module.exports = TipoProfesional;
