// controllers/solicitudController.js
const SolicitudServicio = require('../models/solicitudServicioModel');
const HistorialServicio = require('../models/historialServicioModel');
const EstadoSolServicio = require('../models/estadoSolServicioModel');
const TipoProfesional = require('../models/tipoProfesionalModel');
const db = require('../config/db');
const Notificacion = require('../models/notificacionModel');

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
 * Obtiene los valores posibles del enum de prioridad desde la base de datos
 */
const getPrioridades = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'solicitud_servicio' 
        AND COLUMN_NAME = 'prioridad'
    `);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo obtener la información de prioridades'
      });
    }

    // Extraer los valores del enum
    // El formato es: enum('baja','media','alta')
    const enumString = rows[0].COLUMN_TYPE;
    const match = enumString.match(/enum\((.*)\)/);
    
    if (!match) {
      return res.status(500).json({
        success: false,
        message: 'Error al parsear los valores del enum'
      });
    }

    // Convertir 'baja','media','alta' a ['baja', 'media', 'alta']
    const prioridades = match[1]
      .split(',')
      .map(val => val.replace(/'/g, '').trim());

    res.json({
      success: true,
      data: prioridades
    });
  } catch (error) {
    console.error('Error al obtener prioridades:', error);
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

    // Obtener el nombre del cliente que creó la solicitud
    const [clienteRows] = await connection.query(
      'SELECT nombre_apellido FROM persona WHERE id = ? LIMIT 1',
      [cliente_persona_id]
    );
    const clienteNombre = (clienteRows[0] && clienteRows[0].nombre_apellido) || 'Cliente';

    // Buscar usuarios profesionales que coinciden con rubro y localidad
    const [profesionalesUsuarios] = await connection.query(`
      SELECT DISTINCT u.id AS usuario_id
      FROM profesional pr
      JOIN profesional_tipo pt ON pr.id = pt.profesional_id
      JOIN persona p ON pr.id = p.id
      JOIN usuario u ON p.usuario_id = u.id
      WHERE pt.tipo_profesional_id = ?
        AND pr.localidad_id = ?
        AND u.rol = 'profesional'
    `, [tipo_profesional_id, localidad_id]);

    // Crear notificación para cada profesional encontrado
    const mensaje = `${clienteNombre} creó una nueva solicitud de servicio: ${titulo}`;
    for (const row of profesionalesUsuarios) {
      await Notificacion.crear({
        usuario_id: row.usuario_id,
        tipo_notificacion: 'solicitud',
        referencia_id: solicitud.id,
        mensaje
      }, connection);
    }

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
 * Acepta filtros opcionales: prioridad, dias, presupuestada, fechaDesde, fechaHasta
 */
const getSolicitudesDisponibles = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const { prioridad, dias, presupuestada, fechaDesde, fechaHasta } = req.query;
    
    // Obtener localidad y tipos de profesional del usuario
    const [profesionalRows] = await db.query(`
      SELECT pr.localidad_id, pt.tipo_profesional_id
      FROM profesional pr
      JOIN persona p ON pr.id = p.id
      JOIN usuario u ON p.usuario_id = u.id
      JOIN profesional_tipo pt ON pr.id = pt.profesional_id
      WHERE u.id = ? AND u.rol = 'profesional'
    `, [usuario_id]);

    if (profesionalRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    const localidadId = profesionalRows[0].localidad_id;
    const tipoProfesionalIds = profesionalRows.map(r => r.tipo_profesional_id);

    // Construir objeto de filtros
    const filtros = {};
    if (prioridad) filtros.prioridad = prioridad;
    if (dias) filtros.dias = dias;
    if (presupuestada) filtros.presupuestada = presupuestada;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;

    // Obtener solicitudes que coincidan con alguno de sus tipos y la localidad
    const solicitudes = await SolicitudServicio.getDisponiblesParaProfesional(
      tipoProfesionalIds,
      localidadId,
      filtros
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
  getSolicitudesDisponibles,
  getPrioridades
};
