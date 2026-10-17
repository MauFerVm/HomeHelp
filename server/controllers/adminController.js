const adminModel = require('../models/adminModel');

const responderLista = (res, data) => {
    res.json({
        success: true,
        data
    });
};

const responderError = (res, error, mensaje) => {
    console.error(mensaje, error);
    res.status(500).json({
        success: false,
        message: mensaje
    });
};

const getUsuarios = async (req, res) => {
    try {
        const usuarios = await adminModel.listarUsuarios();
        responderLista(res, usuarios);
    } catch (error) {
        responderError(res, error, 'No se pudieron obtener los usuarios');
    }
};

const getClientes = async (req, res) => {
    try {
        const clientes = await adminModel.listarClientes();
        responderLista(res, clientes);
    } catch (error) {
        responderError(res, error, 'No se pudieron obtener los clientes');
    }
};

const getProfesionales = async (req, res) => {
    try {
        const profesionales = await adminModel.listarProfesionales();
        responderLista(res, profesionales);
    } catch (error) {
        responderError(res, error, 'No se pudieron obtener los profesionales');
    }
};

const cambiarEstado = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { activo } = req.body;

        if (!Number.isInteger(id) || typeof activo !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Datos de estado inválidos'
            });
        }

        const actualizado = await adminModel.actualizarEstado(id, activo);
        if (!actualizado) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({ success: true, activo });
    } catch (error) {
        responderError(res, error, 'No se pudo cambiar el estado del usuario');
    }
};

const modificarUsuario = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const correo = String(req.body.correo || '').trim();
        const nombre_usuario = String(req.body.nombre_usuario || '').trim();
        const nombre_apellido = req.body.nombre_apellido == null
            ? null
            : String(req.body.nombre_apellido).trim();

        if (!Number.isInteger(id)) {
            return res.status(400).json({ success: false, message: 'Usuario inválido' });
        }
        if (!correo.includes('@') || correo.length > 100) {
            return res.status(400).json({ success: false, message: 'Ingresá un correo válido' });
        }
        if (nombre_usuario.length < 3 || nombre_usuario.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El usuario debe tener entre 3 y 50 caracteres'
            });
        }
        if (nombre_apellido != null && (nombre_apellido.length < 2 || nombre_apellido.length > 100)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener entre 2 y 100 caracteres'
            });
        }

        const actualizado = await adminModel.actualizarUsuario(id, {
            correo,
            nombre_usuario,
            nombre_apellido
        });

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            data: { id, correo, nombre_usuario, nombre_apellido }
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        responderError(res, error, 'No se pudo modificar el usuario');
    }
};

const getReporteIngresos = async (req, res) => {
    try {
        const data = await adminModel.obtenerReporteIngresos();
        responderLista(res, data);
    } catch (error) {
        responderError(res, error, 'No se pudo obtener el reporte de ingresos');
    }
};

const getAnalisisUsuarios = async (req, res) => {
    try {
        const data = await adminModel.obtenerAnalisisUsuarios();
        responderLista(res, data);
    } catch (error) {
        responderError(res, error, 'No se pudo obtener el análisis de usuarios');
    }
};

const getEstadisticasGenerales = async (req, res) => {
    try {
        const data = await adminModel.obtenerEstadisticasGenerales();
        responderLista(res, data);
    } catch (error) {
        responderError(res, error, 'No se pudieron obtener las estadísticas generales');
    }
};

module.exports = {
    getUsuarios,
    getClientes,
    getProfesionales,
    cambiarEstado,
    modificarUsuario,
    getEstadisticasGenerales,
    getReporteIngresos,
    getAnalisisUsuarios
};
