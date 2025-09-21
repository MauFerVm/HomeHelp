// controllers/solicitudController.js
const SolicitudServicio = require('../models/solicitudServicioModel');
const HistorialServicio = require('../models/historialServicioModel');
const EstadoSolServicio = require('../models/estadoSolServicioModel');
const TipoProfesional = require('../models/tipoProfesionalModel');
const Persona = require('../models/personaModel'); 
const notificacionService = require('../services/notificacionService');
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

    // Crear la solicitud de servicio (modelo se encarga del INSERT)
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

    // Guardar la solicitud (save() debe insertar y setear this.id)
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

    // RESPONDO AL CLIENTE YA (la operación crítica se completó)
    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: {
        solicitud: solicitud.toJSON(),
        historial: historial.toJSON()
      }
    });

    // ----------------- CREAR NOTIFICACIONES EN BACKGROUND -----------------
    (async () => {
      try {
        // 1) Obtener datos de la persona creadora para armar el mensaje
        const persona = await Persona.buscarPorId(cliente_persona_id);
        const nombreCliente = persona ? persona.nombre_apellido : 'Un cliente';
        const mensaje = `${nombreCliente} creó una nueva solicitud de servicio que podría interesarte.`;

        // 2) Buscar profesionales que coincidan con tipo_profesional_id y localidad_id
        //    (consulta de solo lectura, sin usar la conexión de la transacción ya liberada)
        const [profesionales] = await db.query(
          `SELECT u.id AS usuario_id
           FROM profesional pr
           JOIN persona per ON pr.id = per.id
           JOIN usuario u ON per.usuario_id = u.id
           WHERE pr.tipo_profesional_id = ? AND pr.localidad_id = ? AND u.activo = 1`,
          [tipo_profesional_id, localidad_id]
        );

        if (Array.isArray(profesionales) && profesionales.length > 0) {
          const destinatarios = profesionales.map(p => ({ usuario_id: p.usuario_id }));

          // 3) Delegar a notificacionService (no debería tocar la BD aquí directamente,
          //    el service delega al model de notificaciones)
          await notificacionService.crearNotificaciones({
            solicitud: { id: solicitud.id, titulo: solicitud.titulo, descripcion: solicitud.descripcion },
            destinatarios,
            mensaje,
            tipo_notificacion: 'solicitud'
          });
        }
        // si no hay profesionales, no hace nada
      } catch (errNotif) {
        // Loguear el error de notifications — **no** hacemos rollback ni afectamos la respuesta ya enviada
        console.error('Error creando notificaciones (background):', errNotif);
      }
    })();
    // -------------------------------------------------------------------

  } catch (error) {
    // Revertir la transacción en caso de error
    try { await connection.rollback(); } catch (e) { /* ignore */ }
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

module.exports = {
  getTiposTrabajo,
  getEstadosSolicitud,
  crearSolicitud,
  getSolicitudesByCliente,
  getSolicitudById,
  getAllSolicitudes
};
