// models/estadisticasModel.js
const db = require('../config/db');

/**
 * Presupuestos del profesional en un rango, cruzados con el presupuesto
 * aceptado de la misma solicitud (si existe).
 */
const getComparacionPresupuestos = async (profesionalPersonaId, fechaDesde, fechaHasta) => {
    const query = `
        SELECT
            p.id AS presupuesto_id,
            p.solicitud_id,
            p.monto AS monto_propio,
            p.estado AS estado_propio,
            p.creado_en,
            ss.titulo AS solicitud_titulo,
            ss.estado_id AS solicitud_estado_id,
            ess.nombre AS solicitud_estado,
            ganador.id AS presupuesto_ganador_id,
            ganador.monto AS monto_ganador,
            ganador.profesional_persona_id AS ganador_persona_id
        FROM presupuesto p
        JOIN solicitud_servicio ss ON p.solicitud_id = ss.id
        JOIN estado_sol_servicio ess ON ss.estado_id = ess.id
        LEFT JOIN presupuesto ganador
            ON ganador.solicitud_id = p.solicitud_id
            AND ganador.estado = 'aceptado'
            AND ganador.id = (
                SELECT MIN(p2.id)
                FROM presupuesto p2
                WHERE p2.solicitud_id = p.solicitud_id
                  AND p2.estado = 'aceptado'
            )
        WHERE p.profesional_persona_id = ?
          AND p.creado_en >= ?
          AND p.creado_en <= ?
        ORDER BY p.creado_en DESC
    `;

    const [rows] = await db.execute(query, [
        profesionalPersonaId,
        fechaDesde,
        fechaHasta
    ]);

    return rows;
};

/**
 * Calificaciones activas recibidas por el profesional en un rango.
 */
const getCalificacionesReputacion = async (profesionalPersonaId, fechaDesde, fechaHasta) => {
    const query = `
        SELECT
            c.id,
            c.puntuacion,
            c.comentario,
            c.creado_en,
            c.solicitud_id,
            calificador.nombre_apellido AS calificador_nombre,
            ss.titulo AS solicitud_titulo
        FROM calificaciones c
        JOIN persona calificador ON c.calificador_persona_id = calificador.id
        LEFT JOIN solicitud_servicio ss ON c.solicitud_id = ss.id
        WHERE c.calificado_persona_id = ?
          AND c.activo = 1
          AND c.creado_en >= ?
          AND c.creado_en <= ?
        ORDER BY c.creado_en DESC
    `;

    const [rows] = await db.execute(query, [
        profesionalPersonaId,
        fechaDesde,
        fechaHasta
    ]);

    return rows;
};

/**
 * Ingresos cobrados agrupados por semana o mes.
 * No devuelve órdenes individuales.
 */
const getIngresosAgrupados = async (profesionalPersonaId, fechaDesde, fechaHasta, granularidad) => {
    const grupo = granularidad === 'semana'
        ? `DATE_FORMAT(
            DATE_SUB(ot.fecha_programada, INTERVAL WEEKDAY(ot.fecha_programada) DAY),
            '%Y-%m-%d'
          )`
        : `DATE_FORMAT(ot.fecha_programada, '%Y-%m-01')`;

    const query = `
        SELECT
            ${grupo} AS periodo_inicio,
            SUM(ot.monto) AS ingresos,
            COUNT(ot.id) AS cantidad
        FROM orden_de_trabajo ot
        WHERE ot.profesional_id = ?
          AND ot.is_active = 1
          AND ot.estado IN ('completado', 'cerradoprofesional')
          AND ot.fecha_programada >= ?
          AND ot.fecha_programada <= ?
        GROUP BY periodo_inicio
        ORDER BY periodo_inicio ASC
    `;

    const [rows] = await db.execute(query, [
        profesionalPersonaId,
        fechaDesde,
        fechaHasta
    ]);

    return rows;
};

const ESTADOS_GASTO_CLIENTE = `('completado', 'cerradoprofesional', 'calificada')`;

/**
 * Gastos del cliente agrupados por semana o mes.
 * Si se indica un rubro, solo entran las órdenes de ese tipo de profesional.
 */
const getGastosAgrupados = async (clientePersonaId, fechaDesde, fechaHasta, granularidad, tipoProfesionalId = null) => {
    const grupo = granularidad === 'semana'
        ? `DATE_FORMAT(
            DATE_SUB(ot.fecha_programada, INTERVAL WEEKDAY(ot.fecha_programada) DAY),
            '%Y-%m-%d'
          )`
        : `DATE_FORMAT(ot.fecha_programada, '%Y-%m-01')`;

    const params = [clientePersonaId, fechaDesde, fechaHasta];
    let filtroRubro = '';

    if (tipoProfesionalId) {
        filtroRubro = 'AND ss.tipo_profesional_id = ?';
        params.push(tipoProfesionalId);
    }

    const query = `
        SELECT
            ${grupo} AS periodo_inicio,
            SUM(ot.monto) AS gastos,
            COUNT(ot.id) AS cantidad
        FROM orden_de_trabajo ot
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
        WHERE ot.cliente_persona_id = ?
          AND ot.is_active = 1
          AND ot.estado IN ${ESTADOS_GASTO_CLIENTE}
          AND ot.fecha_programada >= ?
          AND ot.fecha_programada <= ?
          ${filtroRubro}
        GROUP BY periodo_inicio
        ORDER BY periodo_inicio ASC
    `;

    const [rows] = await db.execute(query, params);
    return rows;
};

/**
 * Totales por rubro del cliente en el rango, sin filtrar por uno solo.
 * Alimenta las opciones del filtro dentro del panel de gastos.
 */
const getGastosPorRubro = async (clientePersonaId, fechaDesde, fechaHasta) => {
    const query = `
        SELECT
            tp.id,
            tp.nombre,
            SUM(ot.monto) AS total,
            COUNT(ot.id) AS cantidad
        FROM orden_de_trabajo ot
        JOIN solicitud_servicio ss ON ot.solicitud_id = ss.id
        JOIN tipo_profesional tp ON ss.tipo_profesional_id = tp.id
        WHERE ot.cliente_persona_id = ?
          AND ot.is_active = 1
          AND ot.estado IN ${ESTADOS_GASTO_CLIENTE}
          AND ot.fecha_programada >= ?
          AND ot.fecha_programada <= ?
        GROUP BY tp.id, tp.nombre
        ORDER BY total DESC, tp.nombre ASC
    `;

    const [rows] = await db.execute(query, [
        clientePersonaId,
        fechaDesde,
        fechaHasta
    ]);

    return rows;
};

/**
 * Solicitudes publicadas por el cliente en el rango, con las ofertas que recibieron.
 * La cohorte es la fecha de la solicitud, no la del presupuesto.
 */
const getSolicitudesYPresupuestos = async (clientePersonaId, fechaDesde, fechaHasta) => {
    const query = `
        SELECT
            tp.id,
            tp.nombre,
            COUNT(DISTINCT ss.id) AS solicitudes_publicadas,
            COUNT(p.id) AS presupuestos_recibidos,
            SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) AS sin_oferta,
            COUNT(DISTINCT CASE WHEN p.estado = 'aceptado' THEN ss.id END) AS con_aceptado
        FROM solicitud_servicio ss
        JOIN tipo_profesional tp ON ss.tipo_profesional_id = tp.id
        LEFT JOIN presupuesto p ON p.solicitud_id = ss.id
        WHERE ss.cliente_persona_id = ?
          AND ss.creado_en >= ?
          AND ss.creado_en <= ?
        GROUP BY tp.id, tp.nombre
        ORDER BY solicitudes_publicadas DESC, tp.nombre ASC
    `;

    const [rows] = await db.execute(query, [
        clientePersonaId,
        fechaDesde,
        fechaHasta
    ]);

    return rows;
};

module.exports = {
    getComparacionPresupuestos,
    getCalificacionesReputacion,
    getIngresosAgrupados,
    getGastosAgrupados,
    getGastosPorRubro,
    getSolicitudesYPresupuestos
};
