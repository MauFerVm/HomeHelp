// models/provinciaModel.js
const db = require('../config/db');

class Provincia {
  constructor({ id = null, nombre }) {
    this.id = id;
    this.nombre = nombre;
  }

  /**
   * Trae todas las provincias
   * @returns {Promise<Provincia[]>}
   */
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, nombre FROM provincia ORDER BY nombre'
    );
    return rows.map(r => new Provincia(r));
  }

  /**
   * toJSON: convierte a objeto plano
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre
    };
  }
}

module.exports = Provincia;
