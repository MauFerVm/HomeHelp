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
        is_active = 1,
        previous_orden_id = null
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
            previous_orden_id,
            creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
        is_active,
        previous_orden_id
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
const getOrdenesByProfesional = async (profesionalId) => {
    const query = `
        SELECT 
            ot.*,
            p.nombre_apellido as cliente_nombre,
            ss.titulo as solicitud_titulo,
            ss.direccion
        FROM orden_de_trabajo ot
        JOIN persona p ON ot.cliente_persona_id = p.id
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
        WHERE ot.profesional_id = ? AND ot.is_active = 1
        ORDER BY ot.fecha_programada DESC, ot.horarioInicio DESC
    `;

    const [rows] = await db.execute(query, [profesionalId]);
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
            ss.direccion
        FROM orden_de_trabajo ot
        JOIN persona prof_per ON ot.profesional_id = prof_per.id
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
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

module.exports = {
    crearOrdenTrabajo,
    getOrdenTrabajoById,
    getOrdenesByProfesional,
    getOrdenesByCliente,
    actualizarEstadoOrden
};

