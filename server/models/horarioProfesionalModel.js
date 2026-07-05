// models/horarioProfesionalModel.js
const db = require('../config/db');

/**
 * Obtener horarios activos de un profesional para un rango de fechas
 */
const getHorariosActivos = async (profesionalId, fechaInicio, fechaFin) => {
    try {
        const query = `
            SELECT 
                hp.id,
                hp.profesional_id,
                hp.fechaInicio,
                hp.fechaFin,
                hp.notas,
                hd.dia_semana,
                hd.horaInicio,
                hd.horaFin
            FROM horario_profesional hp
            LEFT JOIN horario_dia hd ON hp.id = hd.horario_id
            WHERE hp.profesional_id = ?
            AND (
                (hp.fechaInicio <= ? AND (hp.fechaFin IS NULL OR hp.fechaFin >= ?))
                OR (hp.fechaInicio <= ? AND (hp.fechaFin IS NULL OR hp.fechaFin >= ?))
            )
            ORDER BY hp.fechaInicio, hd.dia_semana, hd.horaInicio
        `;
        
        const [rows] = await db.execute(query, [
            profesionalId, 
            fechaInicio, 
            fechaInicio, 
            fechaFin, 
            fechaFin
        ]);
        
        return rows;
    } catch (error) {
        console.error('Error al obtener horarios activos:', error);
        throw error;
    }
};

/**
 * Obtener agenda ocupada de un profesional para un rango de fechas
 * Incluye todos los estados excepto 'cancelado' para asegurar que los horarios ocupados no se muestren
 */
const getAgendaOcupada = async (profesionalId, fechaInicio, fechaFin, excluirAgendaId = null) => {
    try {
        let query = `
            SELECT 
                id,
                DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
                horaInicio,
                horaFin,
                estado
            FROM profesional_agenda
            WHERE profesional_id = ?
            AND fecha BETWEEN ? AND ?
            AND estado != 'cancelado'
        `;

        const params = [profesionalId, fechaInicio, fechaFin];

        if (excluirAgendaId) {
            query += ' AND id != ?';
            params.push(excluirAgendaId);
        }

        query += ' ORDER BY fecha, horaInicio';
        
        const [rows] = await db.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error al obtener agenda ocupada:', error);
        throw error;
    }
};

/**
 * Crear nueva entrada en la agenda del profesional
 */
const crearEntradaAgenda = async (profesionalId, solicitudId, presupuestoId, fecha, horaInicio, horaFin, estado = 'pendiente') => {
    try {
        const query = `
            INSERT INTO profesional_agenda 
            (profesional_id, solicitud_id, presupuesto_id, fecha, horaInicio, horaFin, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.execute(query, [
            profesionalId, 
            solicitudId, 
            presupuestoId, 
            fecha, 
            horaInicio, 
            horaFin, 
            estado
        ]);
        
        return result.insertId;
    } catch (error) {
        console.error('Error al crear entrada en agenda:', error);
        throw error;
    }
};

/**
 * Verificar disponibilidad de horario
 */
const verificarDisponibilidad = async (profesionalId, fecha, horaInicio, horaFin, excluirAgendaId = null) => {
    try {
        let query = `
            SELECT COUNT(*) as count
            FROM profesional_agenda
            WHERE profesional_id = ?
            AND fecha = ?
            AND estado IN ('pendiente', 'confirmado', 'en_curso')
            AND (
                (horaInicio < ? AND horaFin > ?) OR
                (horaInicio < ? AND horaFin > ?) OR
                (horaInicio >= ? AND horaFin <= ?)
            )
        `;

        const params = [
            profesionalId,
            fecha,
            horaFin,
            horaInicio,
            horaFin,
            horaInicio,
            horaInicio,
            horaFin
        ];

        if (excluirAgendaId) {
            query += ' AND id != ?';
            params.push(excluirAgendaId);
        }
        
        const [rows] = await db.execute(query, params);
        
        return rows[0].count === 0;
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        throw error;
    }
};

/**
 * Obtener entrada de agenda por solicitud y profesional
 */
const getAgendaBySolicitud = async (solicitudId, profesionalId) => {
    try {
        const query = `
            SELECT id, fecha, horaInicio, horaFin, estado
            FROM profesional_agenda
            WHERE solicitud_id = ?
            AND profesional_id = ?
            AND estado != 'cancelado'
            ORDER BY id DESC
            LIMIT 1
        `;

        const [rows] = await db.execute(query, [solicitudId, profesionalId]);
        return rows[0] || null;
    } catch (error) {
        console.error('Error al obtener agenda por solicitud:', error);
        throw error;
    }
};

/**
 * Actualizar fecha y horario de una entrada en agenda
 */
const actualizarEntradaAgenda = async (agendaId, fecha, horaInicio, horaFin) => {
    try {
        const query = `
            UPDATE profesional_agenda
            SET fecha = ?, horaInicio = ?, horaFin = ?
            WHERE id = ?
        `;

        const [result] = await db.execute(query, [fecha, horaInicio, horaFin, agendaId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error al actualizar entrada en agenda:', error);
        throw error;
    }
};

/**
 * Eliminar entrada de la agenda del profesional
 */
const eliminarEntradaAgenda = async (agendaId) => {
    try {
        const query = 'DELETE FROM profesional_agenda WHERE id = ?';
        const [result] = await db.execute(query, [agendaId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error al eliminar entrada en agenda:', error);
        throw error;
    }
};

module.exports = {
    getHorariosActivos,
    getAgendaOcupada,
    crearEntradaAgenda,
    verificarDisponibilidad,
    getAgendaBySolicitud,
    actualizarEntradaAgenda,
    eliminarEntradaAgenda
};


