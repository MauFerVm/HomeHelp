// server/controllers/authController.js
const pool         = require('../config/db');
const Usuario      = require('../models/userModel');
const Persona      = require('../models/personaModel');
const ClienteHogar = require('../models/clienteHogarModel');
const Profesional  = require('../models/profesionalModel');

exports.registerCompleto = async (req, res) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const {
      correo,
      nombre_usuario,
      contrasena,
      nombre_apellido,
      fecha_nacimiento,
      rol
    } = req.body;

    // validación mínima
    if (!correo || !nombre_usuario || !contrasena || !nombre_apellido || !fecha_nacimiento) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'validation', message: 'Faltan campos obligatorios.' });
    }

    // verificar duplicados
    const [emailRows] = await conn.query('SELECT id FROM usuario WHERE correo = ? LIMIT 1', [correo]);
    if (emailRows.length > 0) {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: 'email_taken', message: 'El correo ya está registrado. Iniciá sesión o usá otro correo.' });
    }
    const [userRows] = await conn.query('SELECT id FROM usuario WHERE nombre_usuario = ? LIMIT 1', [nombre_usuario]);
    if (userRows.length > 0) {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: 'username_taken', message: 'Nombre de usuario no disponible. Elegí otro.' });
    }

    // Determinar rol a guardar (por defecto 'cliente' si no se envía)
    const roleToSave = rol || 'cliente';

    // 1) Insert usuario (AHORA guarda rol)
    const [userResult] = await conn.query(
      'INSERT INTO usuario (correo, nombre_usuario, contraseña, fecha_creacion, activo, rol) VALUES (?, ?, ?, NOW(), TRUE, ?)',
      [correo, nombre_usuario, contrasena, roleToSave]
    );
    const usuarioId = userResult.insertId;

    // 2) Foto de perfil (usando upload.fields())
    const fotoPerfil = req.files && req.files.foto_perfil && req.files.foto_perfil[0] ? req.files.foto_perfil[0].filename : null;

    // 3) Insert persona -> **guardar el insertId** (este será personaId)
    const [personaResult] = await conn.query(
      'INSERT INTO persona (nombre_apellido, fecha_nacimiento, foto_perfil, usuario_id) VALUES (?, ?, ?, ?)',
      [nombre_apellido, fecha_nacimiento, fotoPerfil, usuarioId]
    );
    const personaId = personaResult.insertId;

    // 4) Insert en cliente_hogar o profesional usando personaId COMO PK (no usuarioId)
    if (roleToSave === 'cliente') {
      const { direccion, localidad_id } = req.body;
      if (direccion && localidad_id) {
        await conn.query(
          'INSERT INTO cliente_hogar (id, direccion, localidad_id) VALUES (?, ?, ?)',
          [personaId, direccion, localidad_id]
        );
      }
    } else if (roleToSave === 'profesional') {
      const { presentacion, instituto, tipo_profesional_id, localidad_id } = req.body;
      // foto_titulo: usando upload.fields()
      const fotoTitulo = req.files && req.files.foto_titulo && req.files.foto_titulo[0] ? req.files.foto_titulo[0].filename : null;
      await conn.query(
        'INSERT INTO profesional (id, presentacion, instituto, foto_titulo, tipo_profesional_id, localidad_id) VALUES (?, ?, ?, ?, ?, ?)',
        [personaId, presentacion || null, instituto || null, fotoTitulo, tipo_profesional_id, localidad_id]
      );
    }

    await conn.commit();
    conn.release();
    return res.status(201).json({ message: 'Registro completo exitoso' });

  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    console.error('Error en registerCompleto:', error);

    // manejo duplicados fallback
    if (error && error.code === 'ER_DUP_ENTRY') {
      const msg = error.sqlMessage || '';
      if (msg.toLowerCase().includes('correo')) {
        return res.status(409).json({ error: 'email_taken', message: 'El correo ya está registrado.' });
      }
      if (msg.toLowerCase().includes('nombre_usuario') || msg.toLowerCase().includes('usuario')) {
        return res.status(409).json({ error: 'username_taken', message: 'Nombre de usuario ya existe.' });
      }
      return res.status(409).json({ error: 'duplicate_entry', message: 'Valor duplicado.' });
    }

    return res.status(500).json({ error: 'server_error', message: 'Falló el registro. Intentá más tarde.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { LoginUserName, LoginPassword } = req.body;
    const user = await Usuario.buscarPorCredenciales(LoginUserName, LoginPassword);
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });
    res.json(user.toJSON());
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al autenticar usuario' });
  }
};

exports.getClienteData = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    // Obtener datos del cliente incluyendo dirección y localidad
    const [rows] = await pool.query(`
      SELECT 
        u.id as usuario_id,
        u.correo,
        u.nombre_usuario,
        u.rol,
        p.nombre_apellido,
        p.foto_perfil,
        ch.direccion,
        ch.localidad_id,
        l.nombre as localidad_nombre,
        pr.nombre as provincia_nombre
      FROM usuario u
      LEFT JOIN persona p ON u.id = p.usuario_id
      LEFT JOIN cliente_hogar ch ON p.id = ch.id
      LEFT JOIN localidad l ON ch.localidad_id = l.id
      LEFT JOIN provincia pr ON l.provincia_id = pr.id
      WHERE u.id = ? AND u.rol = 'cliente'
    `, [usuario_id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    const clienteData = rows[0];
    res.json({
      success: true,
      data: {
        usuario_id: clienteData.usuario_id,
        correo: clienteData.correo,
        nombre_usuario: clienteData.nombre_usuario,
        rol: clienteData.rol,
        nombre_apellido: clienteData.nombre_apellido,
        foto_perfil: clienteData.foto_perfil,
        direccion: clienteData.direccion,
        localidad_id: clienteData.localidad_id,
        localidad_nombre: clienteData.localidad_nombre,
        provincia_nombre: clienteData.provincia_nombre
      }
    });

  } catch (error) {
    console.error('Error al obtener datos del cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

exports.getPersonaByUsuarioId = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    // Obtener datos de la persona por usuario_id
    const [rows] = await pool.query(`
      SELECT 
        p.id,
        p.nombre_apellido,
        p.fecha_nacimiento,
        p.foto_perfil,
        p.usuario_id
      FROM persona p
      WHERE p.usuario_id = ?
    `, [usuario_id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Persona no encontrada' 
      });
    }

    const personaData = rows[0];
    res.json({
      success: true,
      data: {
        id: personaData.id,
        nombre_apellido: personaData.nombre_apellido,
        fecha_nacimiento: personaData.fecha_nacimiento,
        foto_perfil: personaData.foto_perfil,
        usuario_id: personaData.usuario_id
      }
    });

  } catch (error) {
    console.error('Error al obtener datos de la persona:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};
