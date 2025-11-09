// models/solicitudServicioModel.js
const db = require('../config/db');

class SolicitudServicio {
  constructor({
    id = null,
    cliente_persona_id,
    tipo_profesional_id,
    titulo,
    descripcion,
    direccion,
    localidad_id,
    estado_id,
    prioridad = 'media',
    foto = null,
    creado_en = new Date()
  }) {
    this.id = id;
    this.cliente_persona_id = cliente_persona_id;
    this.tipo_profesional_id = tipo_profesional_id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.direccion = direccion;
    this.localidad_id = localidad_id;
    this.estado_id = estado_id;
    this.prioridad = prioridad;
    this.foto = foto;
    this.creado_en = creado_en;
  }

  /**
   * Crea una nueva solicitud de servicio
   * @returns {Promise<SolicitudServicio>}
   */
  async save() {
    const [result] = await db.query(
      `INSERT INTO solicitud_servicio 
       (cliente_persona_id, tipo_profesional_id, titulo, descripcion, direccion, 
        localidad_id, estado_id, prioridad, foto, creado_en) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.cliente_persona_id,
        this.tipo_profesional_id,
        this.titulo,
        this.descripcion,
        this.direccion,
        this.localidad_id,
        this.estado_id,
        this.prioridad,
        this.foto,
        this.creado_en
      ]
    );
    this.id = result.insertId;
    return this;
  }

  /**
   * Trae una solicitud por su ID
   * @param {number} id 
   * @returns {Promise<SolicitudServicio|null>}
   */
  static async getById(id) {
    const [rows] = await db.query(
      `SELECT id, cliente_persona_id, tipo_profesional_id, titulo, descripcion, 
              direccion, localidad_id, estado_id, prioridad, foto, creado_en 
       FROM solicitud_servicio WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? new SolicitudServicio(rows[0]) : null;
  }

  /**
   * Trae todas las solicitudes de un cliente
   * @param {number} clientePersonaId 
   * @returns {Promise<SolicitudServicio[]>}
   */
  static async getByCliente(clientePersonaId) {
    const [rows] = await db.query(
      `SELECT id, cliente_persona_id, tipo_profesional_id, titulo, descripcion, 
              direccion, localidad_id, estado_id, prioridad, foto, creado_en 
       FROM solicitud_servicio 
       WHERE cliente_persona_id = ? 
       ORDER BY creado_en DESC`,
      [clientePersonaId]
    );
    return rows.map(r => new SolicitudServicio(r));
  }

  /**
   * Trae todas las solicitudes con información relacionada
   * @returns {Promise<Array>}
   */
  static async getAllWithDetails() {
    const [rows] = await db.query(
      `SELECT 
        ss.id, ss.titulo, ss.descripcion, ss.direccion, ss.prioridad, 
        ss.foto, ss.creado_en,
        p.nombre as cliente_nombre, p.apellido as cliente_apellido,
        tp.nombre as tipo_profesional_nombre,
        l.nombre as localidad_nombre,
        ess.nombre as estado_nombre, ess.vencimiento_dias
       FROM solicitud_servicio ss
       JOIN persona p ON ss.cliente_persona_id = p.id
       JOIN tipo_profesional tp ON ss.tipo_profesional_id = tp.id
       JOIN localidad l ON ss.localidad_id = l.id
       JOIN estado_sol_servicio ess ON ss.estado_id = ess.id
       ORDER BY ss.creado_en DESC`
    );
    return rows;
  }

  /**
   * Trae solicitudes disponibles para un profesional específico
   * Filtra por tipo de profesional y localidad, solo solicitudes abiertas
   * @param {number} tipoProfesionalId 
   * @param {number} localidadId 
   * @param {Object} filtros - Filtros opcionales: prioridad, dias, presupuestada, fechaDesde, fechaHasta
   * @returns {Promise<Array>}
   */
  static async getDisponiblesParaProfesional(tipoProfesionalId, localidadId, filtros = {}) {
    let query = `SELECT 
        ss.id, ss.titulo, ss.descripcion, ss.direccion, ss.prioridad, 
        ss.foto, ss.creado_en, ss.tipo_profesional_id, ss.localidad_id,
        CONCAT(p.nombre_apellido) as cliente_nombre,
        u.correo as cliente_email,
        p.foto_perfil as cliente_foto,
        tp.nombre as tipo_profesional_nombre,
        l.nombre as localidad_nombre,
        ess.nombre as estado_nombre, ess.vencimiento_dias,
        (SELECT COUNT(*) FROM presupuesto pr WHERE pr.solicitud_id = ss.id) as presupuestos_count
       FROM solicitud_servicio ss
       JOIN persona p ON ss.cliente_persona_id = p.id
       JOIN usuario u ON p.usuario_id = u.id
       JOIN tipo_profesional tp ON ss.tipo_profesional_id = tp.id
       JOIN localidad l ON ss.localidad_id = l.id
       JOIN estado_sol_servicio ess ON ss.estado_id = ess.id
       WHERE ss.tipo_profesional_id = ? 
         AND ss.localidad_id = ? 
         AND ess.nombre = 'abierta'`;

    const params = [tipoProfesionalId, localidadId];

    // Filtro por prioridad
    if (filtros.prioridad && ['alta', 'media', 'baja'].includes(filtros.prioridad.toLowerCase())) {
      query += ` AND ss.prioridad = ?`;
      params.push(filtros.prioridad.toLowerCase());
    }

    // Filtro por rango de fechas (tiene prioridad sobre el filtro de días)
    if (filtros.fechaDesde || filtros.fechaHasta) {
      if (filtros.fechaDesde) {
        query += ` AND DATE(ss.creado_en) >= ?`;
        params.push(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        query += ` AND DATE(ss.creado_en) <= ?`;
        params.push(filtros.fechaHasta);
      }
    } else if (filtros.dias && [5, 10, 20].includes(parseInt(filtros.dias))) {
      // Filtro por fecha (últimos X días) - solo si no hay rango de fechas
      query += ` AND ss.creado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
      params.push(parseInt(filtros.dias));
    }

    // Filtro por presupuestada/no presupuestada
    if (filtros.presupuestada !== undefined) {
      if (filtros.presupuestada === 'si' || filtros.presupuestada === true) {
        query += ` AND (SELECT COUNT(*) FROM presupuesto pr WHERE pr.solicitud_id = ss.id) > 0`;
      } else if (filtros.presupuestada === 'no' || filtros.presupuestada === false) {
        query += ` AND (SELECT COUNT(*) FROM presupuesto pr WHERE pr.solicitud_id = ss.id) = 0`;
      }
    }

    query += ` ORDER BY 
         CASE ss.prioridad 
           WHEN 'alta' THEN 1 
           WHEN 'media' THEN 2 
           WHEN 'baja' THEN 3 
         END,
         ss.creado_en DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Actualiza el estado de una solicitud
   * @param {number} id 
   * @param {number} nuevoEstadoId 
   * @returns {Promise<boolean>}
   */
  static async updateEstado(id, nuevoEstadoId) {
    const [result] = await db.query(
      'UPDATE solicitud_servicio SET estado_id = ? WHERE id = ?',
      [nuevoEstadoId, id]
    );
    return result.affectedRows > 0;
  }

  toJSON() {
    return {
      id: this.id,
      cliente_persona_id: this.cliente_persona_id,
      tipo_profesional_id: this.tipo_profesional_id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      direccion: this.direccion,
      localidad_id: this.localidad_id,
      estado_id: this.estado_id,
      prioridad: this.prioridad,
      foto: this.foto,
      creado_en: this.creado_en
    };
  }
}

module.exports = SolicitudServicio;
