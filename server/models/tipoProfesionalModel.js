// models/tipoProfesionalModel.js
const db = require('../config/db');

class TipoProfesional {
  constructor({ id = null, nombre }) {
    this.id = id;
    this.nombre = nombre;
  }

  /**
   * Trae todos los tipos de profesional
   * @returns {Promise<TipoProfesional[]>}
   */
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, nombre FROM tipo_profesional ORDER BY nombre'
    );
    return rows.map(r => new TipoProfesional(r));
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre
    };
  }
}

module.exports = TipoProfesional;
