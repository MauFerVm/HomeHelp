// controllers/ordenTrabajoController.js
const ordenTrabajoModel = require('../models/ordenTrabajoModel');
const horarioModel = require('../models/horarioProfesionalModel');
const Notificacion = require('../models/notificacionModel');
const HistorialServicio = require('../models/historialServicioModel');
const EstadoSolServicio = require('../models/estadoSolServicioModel');
const db = require('../config/db');

/**
 * Obtener orden de trabajo por ID
 */
const getOrdenTrabajoById = async (req, res) => {
    try {
        const { ordenId } = req.params;

        const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        res.json({
            success: true,
            data: orden
        });

    } catch (error) {
        console.error('Error al obtener orden de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener órdenes de trabajo por profesional
 */
const getOrdenesByProfesional = async (req, res) => {
    try {
        const { profesionalId } = req.params;
        const { fechaInicio, fechaFin } = req.query;

        const ordenes = await ordenTrabajoModel.getOrdenesByProfesional(
            profesionalId,
            fechaInicio || null,
            fechaFin || null
        );

        res.json({
            success: true,
            data: ordenes
        });

    } catch (error) {
        console.error('Error al obtener órdenes del profesional:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener órdenes de trabajo por cliente
 */
const getOrdenesByCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;

        const ordenes = await ordenTrabajoModel.getOrdenesByCliente(clienteId);

        res.json({
            success: true,
            data: ordenes
        });

    } catch (error) {
        console.error('Error al obtener órdenes del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar estado de orden de trabajo
 */
const ESTADOS_CERRABLES = ['pendiente', 'reprogramado', 'represupuestada', 'en_curso'];

const NOTAS_HISTORIAL_ESTADO = {
    cerradocliente: 'Cliente cerró la orden de trabajo',
    cerradoprofesional: 'Profesional cerró la orden de trabajo',
    completado: 'Orden confirmada y completada por la otra parte'
};

const actualizarEstadoOrden = async (req, res) => {
    try {
        const { ordenId } = req.params;
        const { estado } = req.body;

        const estadosValidos = [
            'pendiente', 'represupuestada', 'en_curso', 'completado', 'cancelado',
            'reprogramado', 'cerradoprofesional', 'cerradocliente', 'calificada'
        ];
        
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
            });
        }

        if (estado === 'calificada') {
            return res.status(400).json({
                success: false,
                message: 'El estado calificada se asigna automáticamente cuando ambas partes califican'
            });
        }

        const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        if (['cerradocliente', 'cerradoprofesional'].includes(estado)) {
            if (!ESTADOS_CERRABLES.includes(orden.estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden cerrar órdenes en estado pendiente, reprogramado, represupuestada o en curso'
                });
            }
        }

        if (estado === 'completado') {
            if (!['cerradocliente', 'cerradoprofesional'].includes(orden.estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se puede cerrar definitivamente una orden previamente cerrada por cliente o profesional'
                });
            }
        }

        const actualizado = await ordenTrabajoModel.actualizarEstadoOrden(ordenId, estado);

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        if (NOTAS_HISTORIAL_ESTADO[estado]) {
            await ordenTrabajoModel.crearHistorialOrden(
                ordenId,
                orden.estado,
                estado,
                NOTAS_HISTORIAL_ESTADO[estado]
            );
        }

        // Si el estado es "completado", crear registro en historial_servicio
        if (estado === 'completado') {
            try {
                if (orden.solicitud_id) {
                    // Obtener el estado "cerrada" de la tabla estado_sol_servicio
                    const estadoCerrada = await EstadoSolServicio.getByName('cerrada');
                    
                    if (estadoCerrada) {
                        // Crear registro en historial_servicio
                        await HistorialServicio.crearRegistroEstado(
                            orden.solicitud_id,
                            estadoCerrada.id,
                            'Orden de trabajo completada',
                            null // fecha_vencimiento es null para estado cerrada según la BD
                        );
                        console.log(`Historial de servicio creado para solicitud ${orden.solicitud_id} con estado cerrada`);
                    } else {
                        console.error('No se encontró el estado "cerrada" en la tabla estado_sol_servicio');
                    }
                } else {
                    console.error('No se pudo obtener el solicitud_id de la orden de trabajo');
                }
            } catch (error) {
                // Log del error pero no fallar la actualización del estado
                console.error('Error al crear historial de servicio:', error);
            }
        }

        res.json({
            success: true,
            message: 'Estado de la orden actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar estado de orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const HORAS_MINIMAS_REPROGRAMACION = 48;

const formatearFechaNota = (fecha) => {
    if (!fecha) return '';
    const fechaStr = fecha instanceof Date
        ? fecha.toISOString().split('T')[0]
        : String(fecha).split('T')[0];
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio}`;
};

const formatearHoraNota = (hora) => {
    if (!hora) return '';
    return String(hora).substring(0, 5);
};

const obtenerInicioOrden = (fechaProgramada, horarioInicio) => {
    const fechaStr = fechaProgramada instanceof Date
        ? fechaProgramada.toISOString().split('T')[0]
        : String(fechaProgramada).split('T')[0];
    const horaStr = formatearHoraNota(horarioInicio);
    return new Date(`${fechaStr}T${horaStr}:00`);
};

/**
 * Reprogramar horario de una orden de trabajo (solo cliente, con 48hs de anticipación)
 */
const reprogramarHorarioOrden = async (req, res) => {
    try {
        const { ordenId } = req.params;
        const { fecha, horaInicio, horaFin, clientePersonaId } = req.body;

        if (!fecha || !horaInicio || !horaFin || !clientePersonaId) {
            return res.status(400).json({
                success: false,
                message: 'fecha, horaInicio, horaFin y clientePersonaId son requeridos'
            });
        }

        const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        if (Number(orden.cliente_persona_id) !== Number(clientePersonaId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar esta orden'
            });
        }

        const estadosPermitidos = ['pendiente', 'reprogramado'];
        if (!estadosPermitidos.includes(orden.estado)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden reprogramar órdenes en estado pendiente o reprogramado'
            });
        }

        if (!orden.fecha_programada || !orden.horarioInicio) {
            return res.status(400).json({
                success: false,
                message: 'La orden no tiene un horario programado'
            });
        }

        const inicioOrden = obtenerInicioOrden(orden.fecha_programada, orden.horarioInicio);
        const horasRestantes = (inicioOrden.getTime() - Date.now()) / (1000 * 60 * 60);

        if (horasRestantes < HORAS_MINIMAS_REPROGRAMACION) {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede reprogramar con al menos 48 horas de anticipación al inicio del servicio'
            });
        }

        const agenda = await horarioModel.getAgendaBySolicitud(orden.solicitud_id, orden.profesional_id);

        if (!agenda) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la entrada de agenda asociada a esta orden'
            });
        }

        const disponible = await horarioModel.verificarDisponibilidad(
            orden.profesional_id,
            fecha,
            horaInicio,
            horaFin,
            agenda.id
        );

        if (!disponible) {
            return res.status(409).json({
                success: false,
                message: 'El horario seleccionado ya no está disponible'
            });
        }

        const fechaAnterior = formatearFechaNota(orden.fecha_programada);
        const horaAnteriorInicio = formatearHoraNota(orden.horarioInicio);
        const horaAnteriorFin = formatearHoraNota(orden.horaFin);
        const fechaNueva = formatearFechaNota(fecha);
        const horaNuevaInicio = formatearHoraNota(horaInicio);
        const horaNuevaFin = formatearHoraNota(horaFin);

        const notasHistorial = `Cliente movió el turno del ${fechaAnterior} ${horaAnteriorInicio}-${horaAnteriorFin} al ${fechaNueva} ${horaNuevaInicio}-${horaNuevaFin}`;
        const estadoAnterior = orden.estado;
        const estadoNuevo = 'reprogramado';

        await db.query('START TRANSACTION');

        try {
            await ordenTrabajoModel.actualizarHorarioOrden(
                ordenId,
                fecha,
                horaInicio,
                horaFin,
                estadoNuevo
            );

            await horarioModel.actualizarEntradaAgenda(
                agenda.id,
                fecha,
                horaInicio,
                horaFin
            );

            await ordenTrabajoModel.crearHistorialOrden(
                ordenId,
                estadoAnterior,
                estadoNuevo,
                notasHistorial
            );

            const [datosNotificacion] = await db.execute(
                `SELECT 
                    p.nombre_apellido as nombre_cliente,
                    ss.titulo as titulo_solicitud,
                    prof.usuario_id as profesional_usuario_id
                FROM solicitud_servicio ss
                INNER JOIN persona p ON ss.cliente_persona_id = p.id
                INNER JOIN persona prof ON prof.id = ?
                WHERE ss.id = ?`,
                [orden.profesional_id, orden.solicitud_id]
            );

            if (datosNotificacion.length > 0) {
                const { nombre_cliente, titulo_solicitud, profesional_usuario_id } = datosNotificacion[0];
                const mensajeNotificacion = `${nombre_cliente} reprogramó el servicio "${titulo_solicitud}" para el ${fechaNueva} de ${horaNuevaInicio} a ${horaNuevaFin}`;

                await Notificacion.crear({
                    usuario_id: profesional_usuario_id,
                    tipo_notificacion: 'solicitud',
                    referencia_id: orden.solicitud_id,
                    mensaje: mensajeNotificacion
                }, db);
            }

            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Horario reprogramado exitosamente',
                data: {
                    ordenId,
                    fecha,
                    horaInicio,
                    horaFin,
                    estado: estadoNuevo
                }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error al reprogramar horario de orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Cancelar orden de trabajo (solo profesional, con 48hs de anticipación)
 */
const cancelarOrdenProfesional = async (req, res) => {
    try {
        const { ordenId } = req.params;
        const { profesionalPersonaId } = req.body;

        if (!profesionalPersonaId) {
            return res.status(400).json({
                success: false,
                message: 'profesionalPersonaId es requerido'
            });
        }

        const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        if (Number(orden.profesional_id) !== Number(profesionalPersonaId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cancelar esta orden'
            });
        }

        const estadosPermitidos = ['pendiente', 'reprogramado', 'represupuestada'];
        if (!estadosPermitidos.includes(orden.estado)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar órdenes en estado pendiente, reprogramado o represupuestada'
            });
        }

        if (!orden.fecha_programada || !orden.horarioInicio) {
            return res.status(400).json({
                success: false,
                message: 'La orden no tiene un horario programado'
            });
        }

        const inicioOrden = obtenerInicioOrden(orden.fecha_programada, orden.horarioInicio);
        const horasRestantes = (inicioOrden.getTime() - Date.now()) / (1000 * 60 * 60);

        if (horasRestantes < HORAS_MINIMAS_REPROGRAMACION) {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede cancelar con al menos 48 horas de anticipación al inicio del servicio'
            });
        }

        const agenda = await horarioModel.getAgendaBySolicitud(orden.solicitud_id, orden.profesional_id);

        if (!agenda) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la entrada de agenda asociada a esta orden'
            });
        }

        const estadoAnterior = orden.estado;
        const estadoNuevo = 'cancelado';
        const fechaServicio = formatearFechaNota(orden.fecha_programada);
        const horaInicio = formatearHoraNota(orden.horarioInicio);
        const horaFin = formatearHoraNota(orden.horaFin);
        const notasHistorial = `Profesional canceló la orden programada para el ${fechaServicio} de ${horaInicio} a ${horaFin}`;

        await db.query('START TRANSACTION');

        try {
            await ordenTrabajoModel.actualizarEstadoOrden(ordenId, estadoNuevo);

            await horarioModel.eliminarEntradaAgenda(agenda.id);

            await ordenTrabajoModel.crearHistorialOrden(
                ordenId,
                estadoAnterior,
                estadoNuevo,
                notasHistorial
            );

            const [datosNotificacion] = await db.execute(
                `SELECT 
                    prof.nombre_apellido as nombre_profesional,
                    ss.titulo as titulo_solicitud,
                    p.usuario_id as cliente_usuario_id
                FROM solicitud_servicio ss
                INNER JOIN persona prof ON prof.id = ?
                INNER JOIN persona p ON ss.cliente_persona_id = p.id
                WHERE ss.id = ?`,
                [orden.profesional_id, orden.solicitud_id]
            );

            if (datosNotificacion.length > 0) {
                const { nombre_profesional, titulo_solicitud, cliente_usuario_id } = datosNotificacion[0];
                const mensajeNotificacion = `${nombre_profesional} canceló el servicio "${titulo_solicitud}" programado para el ${fechaServicio} de ${horaInicio} a ${horaFin}`;

                await Notificacion.crear({
                    usuario_id: cliente_usuario_id,
                    tipo_notificacion: 'solicitud',
                    referencia_id: orden.solicitud_id,
                    mensaje: mensajeNotificacion
                }, db);
            }

            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Orden de trabajo cancelada exitosamente',
                data: {
                    ordenId,
                    estado: estadoNuevo
                }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error al cancelar orden de trabajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener historial de cambios de estado de una orden
 */
const getHistorialOrden = async (req, res) => {
    try {
        const { ordenId } = req.params;

        const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);

        if (!orden) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        const historial = await ordenTrabajoModel.getHistorialByOrdenId(ordenId);

        res.json({
            success: true,
            data: historial
        });
    } catch (error) {
        console.error('Error al obtener historial de orden:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getOrdenTrabajoById,
    getOrdenesByProfesional,
    getOrdenesByCliente,
    actualizarEstadoOrden,
    reprogramarHorarioOrden,
    cancelarOrdenProfesional,
    getHistorialOrden
};


