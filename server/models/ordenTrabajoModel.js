// models/ordenTrabajoModel.js
const db = require('../config/db');

/**
 * Crear una nueva orden de trabajo
 */
const crearOrdenTrabajo = async (ordenData) => {
    const {
        presupuesto_id,
        solicitud_id,
        profesional_id,
        cliente_persona_id,
        monto,
        descripcion,
        fecha_programada,
        horarioInicio,
        horaFin,
        estado = 'pendiente',
        is_active = 1
    } = ordenData;

    const query = `
        INSERT INTO orden_de_trabajo (
            presupuesto_id,
            solicitud_id,
            profesional_id,
            cliente_persona_id,
            monto,
            descripcion,
            fecha_programada,
            horarioInicio,
            horaFin,
            estado,
            is_active,
            creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.execute(query, [
        presupuesto_id,
        solicitud_id,
        profesional_id,
        cliente_persona_id,
        monto,
        descripcion,
        fecha_programada,
        horarioInicio,
        horaFin,
        estado,
        is_active
    ]);

    return result.insertId;
};

/**
 * Obtener orden de trabajo por ID
 */
const getOrdenTrabajoById = async (ordenId) => {
    const query = `
        SELECT 
            ot.*,
            p.nombre_apellido as cliente_nombre,
            prof_per.nombre_apellido as profesional_nombre,
            ss.titulo as solicitud_titulo
        FROM orden_de_trabajo ot
        JOIN persona p ON ot.cliente_persona_id = p.id
        JOIN persona prof_per ON ot.profesional_id = prof_per.id
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
        WHERE ot.id = ?
    `;

    const [rows] = await db.execute(query, [ordenId]);
    return rows[0] || null;
};

/**
 * Obtener órdenes de trabajo por profesional
 */
const getOrdenesByProfesional = async (profesionalId, fechaInicio = null, fechaFin = null) => {
    let query = `
        SELECT 
            ot.*,
            p.nombre_apellido as cliente_nombre,
            ss.titulo as solicitud_titulo,
            ss.direccion
        FROM orden_de_trabajo ot
        JOIN persona p ON ot.cliente_persona_id = p.id
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
        WHERE ot.profesional_id = ? AND ot.is_active = 1
    `;

    const params = [profesionalId];

    if (fechaInicio) {
        query += ' AND ot.fecha_programada >= ?';
        params.push(fechaInicio);
    }

    if (fechaFin) {
        query += ' AND ot.fecha_programada <= ?';
        params.push(fechaFin);
    }

    query += ' ORDER BY ot.fecha_programada ASC, ot.horarioInicio ASC';

    const [rows] = await db.execute(query, params);
    return rows;
};

/**
 * Obtener órdenes de trabajo por cliente
 */
const getOrdenesByCliente = async (clientePersonaId) => {
    const query = `
        SELECT 
            ot.*,
            prof_per.nombre_apellido as profesional_nombre,
            ss.titulo as solicitud_titulo,
            ss.direccion,
            p.duracion as presupuesto_duracion
        FROM orden_de_trabajo ot
        JOIN persona prof_per ON ot.profesional_id = prof_per.id
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
        LEFT JOIN presupuesto p ON ot.presupuesto_id = p.id
        WHERE ot.cliente_persona_id = ? AND ot.is_active = 1
        ORDER BY ot.fecha_programada DESC, ot.horarioInicio DESC
    `;

    const [rows] = await db.execute(query, [clientePersonaId]);
    return rows;
};

/**
 * Actualizar estado de orden de trabajo
 */
const actualizarEstadoOrden = async (ordenId, nuevoEstado) => {
    const query = 'UPDATE orden_de_trabajo SET estado = ? WHERE id = ?';
    const [result] = await db.execute(query, [nuevoEstado, ordenId]);
    return result.affectedRows > 0;
};

/**
 * Actualizar horario de una orden de trabajo
 */
const actualizarHorarioOrden = async (ordenId, fecha, horaInicio, horaFin, nuevoEstado) => {
    const query = `
        UPDATE orden_de_trabajo
        SET fecha_programada = ?, horarioInicio = ?, horaFin = ?, estado = ?
        WHERE id = ?
    `;
    const [result] = await db.execute(query, [fecha, horaInicio, horaFin, nuevoEstado, ordenId]);
    return result.affectedRows > 0;
};

/**
 * Obtener orden activa por solicitud
 */
const getOrdenActivaBySolicitud = async (solicitudId) => {
    const query = `
        SELECT *
        FROM orden_de_trabajo
        WHERE solicitud_id = ? AND is_active = 1
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] = await db.execute(query, [solicitudId]);
    return rows[0] || null;
};

/**
 * Obtener historial de una orden de trabajo
 */
const getHistorialByOrdenId = async (ordenId) => {
    const query = `
        SELECT id, orden_id, estado_anterior, estado_nuevo, notas, creado_en
        FROM historial_orden_trabajo
        WHERE orden_id = ?
        ORDER BY creado_en ASC, id ASC
    `;

    const [rows] = await db.execute(query, [ordenId]);
    return rows;
};

/**
 * Crear registro en historial de orden de trabajo
 */
const crearHistorialOrden = async (ordenId, estadoAnterior, estadoNuevo, notas) => {
    const query = `
        INSERT INTO historial_orden_trabajo (orden_id, estado_anterior, estado_nuevo, notas)
        VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [ordenId, estadoAnterior, estadoNuevo, notas]);
    return result.insertId;
};

module.exports = {
    crearOrdenTrabajo,
    getOrdenTrabajoById,
    getOrdenActivaBySolicitud,
    getOrdenesByProfesional,
    getOrdenesByCliente,
    actualizarEstadoOrden,
    actualizarHorarioOrden,
    crearHistorialOrden,
    getHistorialByOrdenId
};

