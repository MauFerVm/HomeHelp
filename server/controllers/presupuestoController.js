// controllers/presupuestoController.js
const db = require('../config/db');

/**
 * Crear un nuevo presupuesto
 */
const crearPresupuesto = async (req, res) => {
    try {
        const { solicitud_id, profesional_persona_id, monto, descripcion, estado = 'enviado' } = req.body;

        // Validaciones
        if (!solicitud_id || !profesional_persona_id || !monto || !descripcion) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (monto <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        // Verificar que la solicitud existe
        const solicitudQuery = 'SELECT id FROM solicitud_servicio WHERE id = ?';
        const [solicitudRows] = await db.execute(solicitudQuery, [solicitud_id]);
        
        if (solicitudRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'La solicitud no existe'
            });
        }

        // Verificar que el profesional existe
        // Necesitamos buscar por el ID de la persona que corresponde al usuario
        const profesionalQuery = `
            SELECT p.id 
            FROM profesional p 
            JOIN persona per ON p.id = per.id 
            WHERE per.usuario_id = ?
        `;
        const [profesionalRows] = await db.execute(profesionalQuery, [profesional_persona_id]);
        
        if (profesionalRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El profesional no existe'
            });
        }

        // Obtener el ID real de la persona para usar en el presupuesto
        const personaQuery = 'SELECT id FROM persona WHERE usuario_id = ?';
        const [personaRows] = await db.execute(personaQuery, [profesional_persona_id]);
        const personaId = personaRows[0].id;

        // Verificar que no existe ya un presupuesto del mismo profesional para la misma solicitud
        const presupuestoExistenteQuery = `
            SELECT id FROM presupuesto 
            WHERE solicitud_id = ? AND profesional_persona_id = ?
        `;
        const [presupuestoExistenteRows] = await db.execute(presupuestoExistenteQuery, [solicitud_id, personaId]);
        
        if (presupuestoExistenteRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya has enviado un presupuesto para esta solicitud'
            });
        }

        // Insertar el presupuesto
        const insertQuery = `
            INSERT INTO presupuesto (solicitud_id, profesional_persona_id, monto, descripcion, estado, creado_en)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await db.execute(insertQuery, [
            solicitud_id,
            personaId,
            monto,
            descripcion,
            estado
        ]);

        res.status(201).json({
            success: true,
            message: 'Presupuesto enviado exitosamente',
            data: {
                id: result.insertId,
                solicitud_id,
                profesional_persona_id: personaId,
                monto,
                descripcion,
                estado,
                creado_en: new Date()
            }
        });

    } catch (error) {
        console.error('Error al crear presupuesto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener presupuestos por solicitud
 */
const getPresupuestosBySolicitud = async (req, res) => {
    try {
        const { solicitudId } = req.params;

        const query = `
            SELECT 
                p.id,
                p.solicitud_id,
                p.profesional_persona_id,
                p.monto,
                p.descripcion,
                p.estado,
                p.creado_en,
                per.nombre_apellido as profesional_nombre,
                per.foto_perfil as profesional_foto,
                prof.presentacion,
                prof.instituto,
                tp.nombre as tipo_profesional
            FROM presupuesto p
            JOIN persona per ON p.profesional_persona_id = per.id
            JOIN profesional prof ON p.profesional_persona_id = prof.id
            JOIN tipo_profesional tp ON prof.tipo_profesional_id = tp.id
            WHERE p.solicitud_id = ?
            ORDER BY p.creado_en DESC
        `;

        const [rows] = await db.execute(query, [solicitudId]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error al obtener presupuestos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener presupuestos por profesional
 */
const getPresupuestosByProfesional = async (req, res) => {
    try {
        const { profesionalId } = req.params;

        const query = `
            SELECT 
                p.id,
                p.solicitud_id,
                p.profesional_persona_id,
                p.monto,
                p.descripcion,
                p.estado,
                p.creado_en,
                ss.titulo as solicitud_titulo,
                ss.descripcion as solicitud_descripcion,
                ss.direccion,
                ss.prioridad,
                ss.creado_en as solicitud_creado_en,
                per.nombre_apellido as cliente_nombre,
                per.foto_perfil as cliente_foto,
                l.nombre as localidad,
                pr.nombre as provincia
            FROM presupuesto p
            JOIN solicitud_servicio ss ON p.solicitud_id = ss.id
            JOIN persona per ON ss.cliente_persona_id = per.id
            JOIN localidad l ON ss.localidad_id = l.id
            JOIN provincia pr ON l.provincia_id = pr.id
            WHERE p.profesional_persona_id = ?
            ORDER BY p.creado_en DESC
        `;

        const [rows] = await db.execute(query, [profesionalId]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error al obtener presupuestos del profesional:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar estado de presupuesto
 */
const actualizarEstadoPresupuesto = async (req, res) => {
    try {
        const { presupuestoId } = req.params;
        const { estado } = req.body;

        if (!estado || !['enviado', 'aceptado', 'rechazado'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Debe ser: enviado, aceptado o rechazado'
            });
        }

        const query = 'UPDATE presupuesto SET estado = ? WHERE id = ?';
        const [result] = await db.execute(query, [estado, presupuestoId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Presupuesto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Estado del presupuesto actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar estado del presupuesto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verificar si un profesional ya presupuestó una solicitud específica
 */
const verificarPresupuestoExistente = async (req, res) => {
    try {
        const { solicitudId, profesionalId } = req.params;

        // Primero obtener el ID de la persona correspondiente al usuario
        const personaQuery = 'SELECT id FROM persona WHERE usuario_id = ?';
        const [personaRows] = await db.execute(personaQuery, [profesionalId]);
        
        if (personaRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
        }

        const personaId = personaRows[0].id;

        const query = `
            SELECT 
                p.id,
                p.estado,
                p.creado_en,
                p.monto
            FROM presupuesto p
            WHERE p.solicitud_id = ? AND p.profesional_persona_id = ?
        `;

        const [rows] = await db.execute(query, [solicitudId, personaId]);

        res.json({
            success: true,
            data: {
                existe: rows.length > 0,
                presupuesto: rows.length > 0 ? rows[0] : null
            }
        });

    } catch (error) {
        console.error('Error al verificar presupuesto existente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    crearPresupuesto,
    getPresupuestosBySolicitud,
    getPresupuestosByProfesional,
    actualizarEstadoPresupuesto,
    verificarPresupuestoExistente
};
