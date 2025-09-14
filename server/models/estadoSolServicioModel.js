// models/estadoSolServicioModel.js
const db = require('../config/db');

class EstadoSolServicio {
  constructor({ id = null, nombre, vencimiento_dias }) {
    this.id = id;
    this.nombre = nombre;
    this.vencimiento_dias = vencimiento_dias;
  }

  /**
   * Trae todos los estados de solicitud de servicio
   * @returns {Promise<EstadoSolServicio[]>}
   */
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, nombre, vencimiento_dias FROM estado_sol_servicio ORDER BY id'
    );
    return rows.map(r => new EstadoSolServicio(r));
  }

  /**
   * Trae un estado por su ID
   * @param {number} id 
   * @returns {Promise<EstadoSolServicio|null>}
   */
  static async getById(id) {
    const [rows] = await db.query(
      'SELECT id, nombre, vencimiento_dias FROM estado_sol_servicio WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? new EstadoSolServicio(rows[0]) : null;
  }

  /**
   * Trae un estado por su nombre
   * @param {string} nombre 
   * @returns {Promise<EstadoSolServicio|null>}
   */
  static async getByName(nombre) {
    const [rows] = await db.query(
      'SELECT id, nombre, vencimiento_dias FROM estado_sol_servicio WHERE nombre = ?',
      [nombre]
    );
    return rows.length > 0 ? new EstadoSolServicio(rows[0]) : null;
  }

  /**
   * Calcula la fecha de vencimiento basada en los días de vencimiento
   * @param {Date} fechaCreacion 
   * @returns {Date|null}
   */
  calcularFechaVencimiento(fechaCreacion = new Date()) {
    if (this.vencimiento_dias === 0) {
      return null; // No vence
    }
    const fechaVencimiento = new Date(fechaCreacion);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + this.vencimiento_dias);
    return fechaVencimiento;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      vencimiento_dias: this.vencimiento_dias
    };
  }
}

module.exports = EstadoSolServicio;
