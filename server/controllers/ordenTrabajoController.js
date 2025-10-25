// controllers/ordenTrabajoController.js
const ordenTrabajoModel = require('../models/ordenTrabajoModel');

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

        const ordenes = await ordenTrabajoModel.getOrdenesByProfesional(profesionalId);

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

        const estadosValidos = ['pendiente', 'represupuestada', 'en_curso', 'completado', 'cancelado', 'reprogramado'];
        
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


