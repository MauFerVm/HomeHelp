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

    // 2) Foto de perfil (si usás multer.single('foto_perfil'))
    const fotoPerfil = req.file ? req.file.filename : null;

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
      // foto_titulo: si lo subís con multer, tenés que usar upload.fields (ver nota abajo)
      const fotoTitulo = req.body.foto_titulo || null;
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
