// models/localidadModel.js
const db = require('../config/db');

class Localidad {
  constructor({ id = null, nombre, provincia_id }) {
    this.id = id;
    this.nombre = nombre;
    this.provincia_id = provincia_id;
  }

  /**
   * Trae todas las localidades de una provincia
   * @param {number} provinciaId
   * @returns {Promise<Localidad[]>}
   */
  static async getByProvincia(provinciaId) {
    const [rows] = await db.query(
      'SELECT id, nombre, provincia_id FROM localidad WHERE provincia_id = ? ORDER BY nombre',
      [provinciaId]
    );
    return rows.map(r => new Localidad(r));
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      provincia_id: this.provincia_id
    };
  }
}

module.exports = Localidad;
