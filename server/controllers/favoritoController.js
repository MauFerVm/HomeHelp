const favoritoModel = require('../models/favoritoModel');

const parseId = (value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
};

const crearFavorito = async (req, res) => {
    try {
        const clientePersonaId = parseId(req.body.cliente_persona_id);
        const profesionalId = parseId(req.body.profesional_id);

        if (!clientePersonaId || !profesionalId) {
            return res.status(400).json({
                success: false,
                message: 'cliente_persona_id y profesional_id son obligatorios'
            });
        }

        if (clientePersonaId === profesionalId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes agregarte a ti mismo como favorito'
            });
        }

        const clienteValido = await favoritoModel.esCliente(clientePersonaId);
        if (!clienteValido) {
            return res.status(403).json({
                success: false,
                message: 'Solo los clientes pueden agregar profesionales a favoritos'
            });
        }

        const profesionalValido = await favoritoModel.esProfesional(profesionalId);
        if (!profesionalValido) {
            return res.status(404).json({
                success: false,
                message: 'El profesional no existe'
            });
        }

        if (await favoritoModel.existe(clientePersonaId, profesionalId)) {
            return res.status(409).json({
                success: false,
                alreadyExists: true,
                message: 'Este profesional ya está en tus favoritos'
            });
        }

        const id = await favoritoModel.crear(clientePersonaId, profesionalId);

        res.status(201).json({
            success: true,
            message: 'Profesional agregado a favoritos',
            data: { id }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                alreadyExists: true,
                message: 'Este profesional ya está en tus favoritos'
            });
        }

        console.error('Error al crear favorito:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

const getFavoritosByCliente = async (req, res) => {
    try {
        const clientePersonaId = parseId(req.params.cliente_persona_id);
        if (!clientePersonaId) {
            return res.status(400).json({
                success: false,
                message: 'cliente_persona_id inválido'
            });
        }

        const favoritos = await favoritoModel.getByCliente(clientePersonaId);
        res.json({
            success: true,
            data: favoritos
        });
    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    crearFavorito,
    getFavoritosByCliente
};
