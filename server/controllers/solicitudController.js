// controllers/solicitudController.js
const SolicitudServicio = require('../models/solicitudServicioModel');
const HistorialServicio = require('../models/historialServicioModel');
const EstadoSolServicio = require('../models/estadoSolServicioModel');
const TipoProfesional = require('../models/tipoProfesionalModel');
const db = require('../config/db');

/**
 * Obtiene los tipos de trabajo (tipos de profesional) activos
 */
const getTiposTrabajo = async (req, res) => {
  try {
    const tiposTrabajo = await TipoProfesional.getActive();
    res.json({
      success: true,
      data: tiposTrabajo
    });
  } catch (error) {
    console.error('Error al obtener tipos de trabajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene los estados de solicitud disponibles
 */
const getEstadosSolicitud = async (req, res) => {
  try {
    const estados = await EstadoSolServicio.getAll();
    res.json({
      success: true,
      data: estados
    });
  } catch (error) {
    console.error('Error al obtener estados de solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Crea una nueva solicitud de servicio con su historial inicial
 * Transacción que crea la solicitud y el primer registro del historial
 */
const crearSolicitud = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      cliente_persona_id,
      tipo_profesional_id,
      titulo,
      descripcion,
      direccion,
      localidad_id,
      prioridad = 'media'
    } = req.body;

    // Obtener la ruta del archivo si se subió una foto
    const foto = req.file ? `/uploads/solicitudes/${req.file.filename}` : null;

    // Validaciones básicas
    if (!cliente_persona_id || !tipo_profesional_id || !titulo || !direccion || !localidad_id) {
      throw new Error('Faltan campos obligatorios');
    }

    // Obtener el estado inicial (por defecto "abierta")
    const estadoInicial = await EstadoSolServicio.getByName('abierta');
    if (!estadoInicial) {
      throw new Error('No se encontró el estado inicial');
    }

    // Crear la solicitud de servicio
    const solicitud = new SolicitudServicio({
      cliente_persona_id,
      tipo_profesional_id,
      titulo,
      descripcion,
      direccion,
      localidad_id,
      estado_id: estadoInicial.id,
      prioridad,
      foto,
      creado_en: new Date()
    });

    // Guardar la solicitud
    await solicitud.save();

    // Calcular la fecha de vencimiento basada en el estado
    const fechaVencimiento = estadoInicial.calcularFechaVencimiento(solicitud.creado_en);

    // Crear el primer registro del historial
    const historial = new HistorialServicio({
      solicitud_id: solicitud.id,
      fecha_creacion: solicitud.creado_en,
      fecha_vencimiento: fechaVencimiento,
      estado_id: estadoInicial.id,
      notas: 'Solicitud creada'
    });

    await historial.save();

    // Confirmar la transacción
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: {
        solicitud: solicitud.toJSON(),
        historial: historial.toJSON()
      }
    });

  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    console.error('Error al crear solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la solicitud',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Obtiene todas las solicitudes de un cliente
 */
const getSolicitudesByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const solicitudes = await SolicitudServicio.getByCliente(clienteId);
    
    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error) {
    console.error('Error al obtener solicitudes del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene una solicitud específica con su historial
 */
const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const solicitud = await SolicitudServicio.getById(id);
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const historial = await HistorialServicio.getBySolicitudWithEstado(id);
    
    res.json({
      success: true,
      data: {
        solicitud: solicitud.toJSON(),
        historial: historial
      }
    });
  } catch (error) {
    console.error('Error al obtener solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene todas las solicitudes con detalles
 */
const getAllSolicitudes = async (req, res) => {
  try {
    const solicitudes = await SolicitudServicio.getAllWithDetails();
    
    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error) {
    console.error('Error al obtener todas las solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtiene solicitudes disponibles para un profesional específico
 * Filtra por tipo de profesional y localidad
 */
const getSolicitudesDisponibles = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    // Primero obtener los datos del profesional
    const [profesionalRows] = await db.query(`
      SELECT 
        pr.tipo_profesional_id,
        pr.localidad_id
      FROM profesional pr
      JOIN persona p ON pr.id = p.id
      JOIN usuario u ON p.usuario_id = u.id
      WHERE u.id = ? AND u.rol = 'profesional'
    `, [usuario_id]);

    if (profesionalRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    const profesional = profesionalRows[0];

    // Obtener solicitudes que coincidan con el tipo de profesional y localidad
    const solicitudes = await SolicitudServicio.getDisponiblesParaProfesional(
      profesional.tipo_profesional_id,
      profesional.localidad_id
    );
    
    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error) {
    console.error('Error al obtener solicitudes disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getTiposTrabajo,
  getEstadosSolicitud,
  crearSolicitud,
  getSolicitudesByCliente,
  getSolicitudById,
  getAllSolicitudes,
  getSolicitudesDisponibles
};
