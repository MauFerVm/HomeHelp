// models/calificacionesModel.js
const db = require('../config/db');

/**
 * Crear una nueva calificación
 */
const crearCalificacion = async (calificacionData) => {
    const {
        solicitud_id,
        calificador_persona_id,
        calificado_persona_id,
        puntuacion,
        comentario = null,
        activo = 1
    } = calificacionData;

    const query = `
        INSERT INTO calificaciones (
            solicitud_id,
            calificador_persona_id,
            calificado_persona_id,
            puntuacion,
            comentario,
            activo,
            creado_en
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.execute(query, [
        solicitud_id,
        calificador_persona_id,
        calificado_persona_id,
        puntuacion,
        comentario,
        activo
    ]);

    return result.insertId;
};

/**
 * Verificar si ya existe una calificación para una solicitud y calificador
 */
const existeCalificacion = async (solicitud_id, calificador_persona_id, calificado_persona_id) => {
    const query = `
        SELECT id 
        FROM calificaciones 
        WHERE solicitud_id = ? 
        AND calificador_persona_id = ? 
        AND calificado_persona_id = ?
        AND activo = 1
    `;

    const [rows] = await db.execute(query, [
        solicitud_id,
        calificador_persona_id,
        calificado_persona_id
    ]);

    return rows.length > 0;
};

/**
 * Obtener calificaciones por solicitud
 */
const getCalificacionesBySolicitud = async (solicitud_id) => {
    const query = `
        SELECT 
            c.*,
            calificador.nombre_apellido as calificador_nombre,
            calificado.nombre_apellido as calificado_nombre
        FROM calificaciones c
        JOIN persona calificador ON c.calificador_persona_id = calificador.id
        JOIN persona calificado ON c.calificado_persona_id = calificado.id
        WHERE c.solicitud_id = ? AND c.activo = 1
        ORDER BY c.creado_en DESC
    `;

    const [rows] = await db.execute(query, [solicitud_id]);
    return rows;
};

/**
 * Obtener calificaciones por persona calificada
 */
const getCalificacionesByPersona = async (persona_id) => {
    const query = `
        SELECT 
            c.*,
            calificador.nombre_apellido as calificador_nombre,
            ss.titulo as solicitud_titulo
        FROM calificaciones c
        JOIN persona calificador ON c.calificador_persona_id = calificador.id
        JOIN solicitud_servicio ss ON c.solicitud_id = ss.id
        WHERE c.calificado_persona_id = ? AND c.activo = 1
        ORDER BY c.creado_en DESC
    `;

    const [rows] = await db.execute(query, [persona_id]);
    return rows;
};

/**
 * Obtener los 5 profesionales destacados con mejor promedio de calificaciones
 */
const getProfesionalesDestacados = async () => {
    const query = `
        SELECT 
            p.id AS persona_id,
            p.nombre_apellido,
            p.foto_perfil,
            ROUND(AVG(c.puntuacion), 1) AS promedio_calificacion,
            COUNT(c.id) AS total_calificaciones,
            (
                SELECT COUNT(*)
                FROM orden_de_trabajo ot
                WHERE ot.profesional_id = p.id
                AND ot.estado IN ('completado', 'cerradoprofesional', 'cerradocliente')
                AND ot.is_active = 1
            ) AS total_trabajos,
            (
                SELECT GROUP_CONCAT(tp.nombre ORDER BY tp.nombre SEPARATOR ', ')
                FROM profesional_tipo pt
                JOIN tipo_profesional tp ON pt.tipo_profesional_id = tp.id
                WHERE pt.profesional_id = pr.id
            ) AS tipo_profesional_nombre
        FROM calificaciones c
        JOIN persona p ON c.calificado_persona_id = p.id
        JOIN profesional pr ON p.id = pr.id
        WHERE c.activo = 1
        GROUP BY p.id, p.nombre_apellido, p.foto_perfil, pr.id
        ORDER BY promedio_calificacion DESC, total_calificaciones DESC, p.nombre_apellido ASC
        LIMIT 5
    `;

    const [rows] = await db.execute(query);
    return rows;
};

module.exports = {
    crearCalificacion,
    existeCalificacion,
    getCalificacionesBySolicitud,
    getCalificacionesByPersona,
    getProfesionalesDestacados
};

