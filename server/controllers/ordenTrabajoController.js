// controllers/ordenTrabajoController.js
const ordenTrabajoModel = require('../models/ordenTrabajoModel');
const HistorialServicio = require('../models/historialServicioModel');
const EstadoSolServicio = require('../models/estadoSolServicioModel');

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
const actualizarEstadoOrden = async (req, res) => {
    try {
        const { ordenId } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['pendiente', 'represupuestada', 'en_curso', 'completado', 'cancelado', 'reprogramado', 'cerradoprofesional', 'cerradocliente'];
        
        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
            });
        }

        const actualizado = await ordenTrabajoModel.actualizarEstadoOrden(ordenId, estado);

        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Orden de trabajo no encontrada'
            });
        }

        // Si el estado es "completado", crear registro en historial_servicio
        if (estado === 'completado') {
            try {
                // Obtener la orden de trabajo para obtener el solicitud_id
                const orden = await ordenTrabajoModel.getOrdenTrabajoById(ordenId);
                
                if (orden && orden.solicitud_id) {
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

module.exports = {
    getOrdenTrabajoById,
    getOrdenesByProfesional,
    getOrdenesByCliente,
    actualizarEstadoOrden
};


