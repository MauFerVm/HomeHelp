const db = require('../config/db');

const esCliente = async (clientePersonaId) => {
    const [rows] = await db.execute(
        'SELECT id FROM cliente_hogar WHERE id = ?',
        [clientePersonaId]
    );
    return rows.length > 0;
};

const esProfesional = async (profesionalId) => {
    const [rows] = await db.execute(
        'SELECT id FROM profesional WHERE id = ?',
        [profesionalId]
    );
    return rows.length > 0;
};

const existe = async (clientePersonaId, profesionalId) => {
    const [rows] = await db.execute(
        `SELECT id
         FROM favoritos
         WHERE cliente_persona_id = ? AND profesional_id = ?
         LIMIT 1`,
        [clientePersonaId, profesionalId]
    );
    return rows.length > 0;
};

const crear = async (clientePersonaId, profesionalId) => {
    const [result] = await db.execute(
        `INSERT INTO favoritos (cliente_persona_id, profesional_id)
         VALUES (?, ?)`,
        [clientePersonaId, profesionalId]
    );
    return result.insertId;
};

const getByCliente = async (clientePersonaId) => {
    const [rows] = await db.execute(
        `SELECT
            f.id,
            f.cliente_persona_id,
            f.profesional_id,
            f.creado_en,
            p.nombre_apellido,
            p.foto_perfil,
            (
                SELECT GROUP_CONCAT(tp.nombre ORDER BY tp.nombre SEPARATOR ', ')
                FROM profesional_tipo pt
                JOIN tipo_profesional tp ON pt.tipo_profesional_id = tp.id
                WHERE pt.profesional_id = pr.id
            ) AS tipo_profesional_nombre,
            (
                SELECT ROUND(AVG(c.puntuacion), 1)
                FROM calificaciones c
                WHERE c.calificado_persona_id = p.id AND c.activo = 1
            ) AS promedio_calificacion,
            (
                SELECT COUNT(c.id)
                FROM calificaciones c
                WHERE c.calificado_persona_id = p.id AND c.activo = 1
            ) AS total_calificaciones
         FROM favoritos f
         JOIN persona p ON f.profesional_id = p.id
         JOIN profesional pr ON pr.id = p.id
         WHERE f.cliente_persona_id = ?
         ORDER BY f.creado_en DESC, p.nombre_apellido ASC`,
        [clientePersonaId]
    );
    return rows;
};

module.exports = {
    esCliente,
    esProfesional,
    existe,
    crear,
    getByCliente
};
