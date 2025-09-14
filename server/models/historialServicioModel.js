// models/historialServicioModel.js
const db = require('../config/db');

class HistorialServicio {
  constructor({
    id = null,
    solicitud_id,
    fecha_creacion = new Date(),
    fecha_vencimiento = null,
    estado_id,
    notas = null
  }) {
    this.id = id;
    this.solicitud_id = solicitud_id;
    this.fecha_creacion = fecha_creacion;
    this.fecha_vencimiento = fecha_vencimiento;
    this.estado_id = estado_id;
    this.notas = notas;
  }

  /**
   * Crea un nuevo registro en el historial de servicio
   * @returns {Promise<HistorialServicio>}
   */
  async save() {
    const [result] = await db.query(
      `INSERT INTO historial_servicio 
       (solicitud_id, fecha_creacion, fecha_vencimiento, estado_id, notas) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        this.solicitud_id,
        this.fecha_creacion,
        this.fecha_vencimiento,
        this.estado_id,
        this.notas
      ]
    );
    this.id = result.insertId;
    return this;
  }

  /**
   * Trae el historial de una solicitud específica
   * @param {number} solicitudId 
   * @returns {Promise<HistorialServicio[]>}
   */
  static async getBySolicitud(solicitudId) {
    const [rows] = await db.query(
      `SELECT id, solicitud_id, fecha_creacion, fecha_vencimiento, estado_id, notas 
       FROM historial_servicio 
       WHERE solicitud_id = ? 
       ORDER BY fecha_creacion ASC`,
      [solicitudId]
    );
    return rows.map(r => new HistorialServicio(r));
  }

  /**
   * Trae el historial de una solicitud con información del estado
   * @param {number} solicitudId 
   * @returns {Promise<Array>}
   */
  static async getBySolicitudWithEstado(solicitudId) {
    const [rows] = await db.query(
      `SELECT 
        hs.id, hs.solicitud_id, hs.fecha_creacion, hs.fecha_vencimiento, 
        hs.estado_id, hs.notas,
        ess.nombre as estado_nombre, ess.vencimiento_dias
       FROM historial_servicio hs
       JOIN estado_sol_servicio ess ON hs.estado_id = ess.id
       WHERE hs.solicitud_id = ? 
       ORDER BY hs.fecha_creacion ASC`,
      [solicitudId]
    );
    return rows;
  }

  /**
   * Trae el último estado de una solicitud
   * @param {number} solicitudId 
   * @returns {Promise<HistorialServicio|null>}
   */
  static async getUltimoEstado(solicitudId) {
    const [rows] = await db.query(
      `SELECT id, solicitud_id, fecha_creacion, fecha_vencimiento, estado_id, notas 
       FROM historial_servicio 
       WHERE solicitud_id = ? 
       ORDER BY fecha_creacion DESC 
       LIMIT 1`,
      [solicitudId]
    );
    return rows.length > 0 ? new HistorialServicio(rows[0]) : null;
  }

  /**
   * Crea un nuevo registro de historial para un cambio de estado
   * @param {number} solicitudId 
   * @param {number} estadoId 
   * @param {string} notas 
   * @param {Date} fechaVencimiento 
   * @returns {Promise<HistorialServicio>}
   */
  static async crearRegistroEstado(solicitudId, estadoId, notas = null, fechaVencimiento = null) {
    const historial = new HistorialServicio({
      solicitud_id: solicitudId,
      estado_id: estadoId,
      notas: notas,
      fecha_vencimiento: fechaVencimiento
    });
    return await historial.save();
  }

  toJSON() {
    return {
      id: this.id,
      solicitud_id: this.solicitud_id,
      fecha_creacion: this.fecha_creacion,
      fecha_vencimiento: this.fecha_vencimiento,
      estado_id: this.estado_id,
      notas: this.notas
    };
  }
}

module.exports = HistorialServicio;
