// controllers/calificacionesController.js
const calificacionesModel = require('../models/calificacionesModel');
const ordenTrabajoModel = require('../models/ordenTrabajoModel');

/**
 * Crear una nueva calificación
 */
const crearCalificacion = async (req, res) => {
    try {
        const {
            solicitud_id,
            calificador_persona_id,
            calificado_persona_id,
            puntuacion,
            comentario
        } = req.body;

        // Validaciones
        if (!solicitud_id || !calificador_persona_id || !calificado_persona_id || !puntuacion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: solicitud_id, calificador_persona_id, calificado_persona_id, puntuacion'
            });
        }

        if (puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                success: false,
                message: 'La puntuación debe estar entre 1 y 5'
            });
        }

        if (calificador_persona_id === calificado_persona_id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes calificarte a ti mismo'
            });
        }

        // Verificar si ya existe una calificación
        const existe = await calificacionesModel.existeCalificacion(
            solicitud_id,
            calificador_persona_id,
            calificado_persona_id
        );

        if (existe) {
            return res.status(400).json({
                success: false,
                message: 'Ya has calificado a esta persona para esta solicitud'
            });
        }

        // Crear la calificación
        const calificacionId = await calificacionesModel.crearCalificacion({
            solicitud_id,
            calificador_persona_id,
            calificado_persona_id,
            puntuacion,
            comentario: comentario || null,
            activo: 1
        });

        const orden = await ordenTrabajoModel.getOrdenActivaBySolicitud(solicitud_id);

        if (orden && orden.estado === 'completado') {
            const clienteCalifico = await calificacionesModel.existeCalificacion(
                solicitud_id,
                orden.cliente_persona_id,
                orden.profesional_id
            );
            const profesionalCalifico = await calificacionesModel.existeCalificacion(
                solicitud_id,
                orden.profesional_id,
                orden.cliente_persona_id
            );

            if (clienteCalifico && profesionalCalifico) {
                await ordenTrabajoModel.actualizarEstadoOrden(orden.id, 'calificada');
                await ordenTrabajoModel.crearHistorialOrden(
                    orden.id,
                    'completado',
                    'calificada',
                    'Ambas partes calificaron el servicio'
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Calificación creada exitosamente',
            data: { id: calificacionId }
        });

    } catch (error) {
        console.error('Error al crear calificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verificar si existe una calificación
 */
const verificarCalificacion = async (req, res) => {
    try {
        const { solicitud_id, calificador_persona_id, calificado_persona_id } = req.query;

        if (!solicitud_id || !calificador_persona_id || !calificado_persona_id) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros requeridos'
            });
        }

        const existe = await calificacionesModel.existeCalificacion(
            solicitud_id,
            calificador_persona_id,
            calificado_persona_id
        );

        res.json({
            success: true,
            data: { existe }
        });

    } catch (error) {
        console.error('Error al verificar calificación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener calificaciones por solicitud
 */
const getCalificacionesBySolicitud = async (req, res) => {
    try {
        const { solicitud_id } = req.params;

        const calificaciones = await calificacionesModel.getCalificacionesBySolicitud(solicitud_id);

        res.json({
            success: true,
            data: calificaciones
        });

    } catch (error) {
        console.error('Error al obtener calificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener calificaciones por persona
 */
const getCalificacionesByPersona = async (req, res) => {
    try {
        const { persona_id } = req.params;

        const calificaciones = await calificacionesModel.getCalificacionesByPersona(persona_id);

        res.json({
            success: true,
            data: calificaciones
        });

    } catch (error) {
        console.error('Error al obtener calificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener profesionales destacados ordenados por calificación
 */
const getProfesionalesDestacados = async (req, res) => {
    try {
        const profesionales = await calificacionesModel.getProfesionalesDestacados();

        res.json({
            success: true,
            data: profesionales
        });
    } catch (error) {
        console.error('Error al obtener profesionales destacados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    crearCalificacion,
    verificarCalificacion,
    getCalificacionesBySolicitud,
    getCalificacionesByPersona,
    getProfesionalesDestacados
};

