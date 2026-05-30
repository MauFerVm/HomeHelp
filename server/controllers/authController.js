// server/controllers/authController.js
const pool         = require('../config/db');
const Usuario      = require('../models/userModel');
const Persona      = require('../models/personaModel');
const ClienteHogar = require('../models/clienteHogarModel');
const Profesional  = require('../models/profesionalModel');
const TipoProfesional = require('../models/tipoProfesionalModel');
const { hashPassword } = require('../utils/password');

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
    const hash = await hashPassword(contrasena);
    const [userResult] = await conn.query(
      'INSERT INTO usuario (correo, nombre_usuario, contraseña, fecha_creacion, activo, rol) VALUES (?, ?, ?, NOW(), TRUE, ?)',
      [correo, nombre_usuario, hash, roleToSave]
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
      const { presentacion, instituto, localidad_id } = req.body;
      const fotoTitulo = req.files && req.files.foto_titulo && req.files.foto_titulo[0] ? req.files.foto_titulo[0].filename : null;

      let tipoIds = req.body.tipo_profesional_ids ?? req.body['tipo_profesional_ids[]'] ?? req.body.tipo_profesional_id;
      if (!Array.isArray(tipoIds)) {
        tipoIds = tipoIds ? [tipoIds] : [];
      }
      tipoIds = tipoIds.map(id => parseInt(id, 10)).filter(id => !Number.isNaN(id));

      if (tipoIds.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ error: 'validation', message: 'Debe seleccionar al menos un tipo de profesional.' });
      }

      const activos = await TipoProfesional.getActive();
      const activosIds = new Set(activos.map(t => t.id));
      const invalidos = tipoIds.filter(id => !activosIds.has(id));
      if (invalidos.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          error: 'validation',
          message: 'Uno o más tipos de profesional no están disponibles.'
        });
      }

      await conn.query(
        'INSERT INTO profesional (id, presentacion, instituto, foto_titulo, localidad_id) VALUES (?, ?, ?, ?, ?)',
        [personaId, presentacion || null, instituto || null, fotoTitulo, localidad_id]
      );

      for (const tipoId of tipoIds) {
        await conn.query(
          'INSERT INTO profesional_tipo (profesional_id, tipo_profesional_id) VALUES (?, ?)',
          [personaId, tipoId]
        );
      }
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
        p.fecha_nacimiento,
        p.foto_perfil,
        ch.direccion,
        ch.localidad_id,
        l.nombre as localidad_nombre,
        l.provincia_id,
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
        fecha_nacimiento: clienteData.fecha_nacimiento,
        foto_perfil: clienteData.foto_perfil,
        direccion: clienteData.direccion,
        localidad_id: clienteData.localidad_id,
        localidad_nombre: clienteData.localidad_nombre,
        provincia_id: clienteData.provincia_id,
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

exports.getProfesionalData = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    
    // Obtener datos del profesional incluyendo tipo de profesional y localidad
    const [rows] = await pool.query(`
      SELECT 
        u.id as usuario_id,
        u.correo,
        u.nombre_usuario,
        u.rol,
        p.nombre_apellido,
        p.fecha_nacimiento,
        p.foto_perfil,
        pr.presentacion,
        pr.instituto,
        pr.foto_titulo,
        pr.localidad_id,
        l.nombre as localidad_nombre,
        l.provincia_id,
        prov.nombre as provincia_nombre,
        (SELECT GROUP_CONCAT(pt.tipo_profesional_id ORDER BY pt.tipo_profesional_id)
         FROM profesional_tipo pt WHERE pt.profesional_id = pr.id) as tipo_profesional_ids,
        (SELECT GROUP_CONCAT(tp.nombre ORDER BY tp.nombre SEPARATOR ', ')
         FROM profesional_tipo pt
         JOIN tipo_profesional tp ON pt.tipo_profesional_id = tp.id
         WHERE pt.profesional_id = pr.id) as tipo_profesional_nombre
      FROM usuario u
      LEFT JOIN persona p ON u.id = p.usuario_id
      LEFT JOIN profesional pr ON p.id = pr.id
      LEFT JOIN localidad l ON pr.localidad_id = l.id
      LEFT JOIN provincia prov ON l.provincia_id = prov.id
      WHERE u.id = ? AND u.rol = 'profesional'
    `, [usuario_id]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profesional no encontrado' 
      });
    }

    const profesionalData = rows[0];
    const tipoProfesionalIds = profesionalData.tipo_profesional_ids
      ? profesionalData.tipo_profesional_ids.split(',').map(id => parseInt(id, 10))
      : [];

    res.json({
      success: true,
      data: {
        usuario_id: profesionalData.usuario_id,
        correo: profesionalData.correo,
        nombre_usuario: profesionalData.nombre_usuario,
        rol: profesionalData.rol,
        nombre_apellido: profesionalData.nombre_apellido,
        fecha_nacimiento: profesionalData.fecha_nacimiento,
        foto_perfil: profesionalData.foto_perfil,
        presentacion: profesionalData.presentacion,
        instituto: profesionalData.instituto,
        foto_titulo: profesionalData.foto_titulo,
        tipo_profesional_ids: tipoProfesionalIds,
        tipo_profesional_id: tipoProfesionalIds[0] ?? null,
        localidad_id: profesionalData.localidad_id,
        localidad_nombre: profesionalData.localidad_nombre,
        provincia_id: profesionalData.provincia_id,
        provincia_nombre: profesionalData.provincia_nombre,
        tipo_profesional_nombre: profesionalData.tipo_profesional_nombre
      }
    });

  } catch (error) {
    console.error('Error al obtener datos del profesional:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

exports.updatePerfil = async (req, res) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const { usuario_id } = req.params;
    const {
      correo,
      nombre_usuario,
      contrasena,
      localidad_id,
      presentacion
    } = req.body;

    if (!correo || !nombre_usuario || !localidad_id) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'Correo, nombre de usuario y localidad son obligatorios.'
      });
    }

    const [userRows] = await conn.query(
      'SELECT id, rol FROM usuario WHERE id = ? LIMIT 1',
      [usuario_id]
    );
    if (userRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const userRol = userRows[0].rol;

    const [emailRows] = await conn.query(
      'SELECT id FROM usuario WHERE correo = ? AND id != ? LIMIT 1',
      [correo, usuario_id]
    );
    if (emailRows.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({
        error: 'email_taken',
        message: 'El correo ya está registrado.'
      });
    }

    const [usernameRows] = await conn.query(
      'SELECT id FROM usuario WHERE nombre_usuario = ? AND id != ? LIMIT 1',
      [nombre_usuario, usuario_id]
    );
    if (usernameRows.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({
        error: 'username_taken',
        message: 'Nombre de usuario no disponible.'
      });
    }

    if (contrasena && String(contrasena).trim() !== '') {
      const hash = await hashPassword(contrasena);
      await conn.query(
        'UPDATE usuario SET correo = ?, nombre_usuario = ?, contraseña = ? WHERE id = ?',
        [correo, nombre_usuario, hash, usuario_id]
      );
    } else {
      await conn.query(
        'UPDATE usuario SET correo = ?, nombre_usuario = ? WHERE id = ?',
        [correo, nombre_usuario, usuario_id]
      );
    }

    const [personaRows] = await conn.query(
      'SELECT id FROM persona WHERE usuario_id = ? LIMIT 1',
      [usuario_id]
    );
    if (personaRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Persona no encontrada' });
    }
    const personaId = personaRows[0].id;

    const fotoPerfil = req.files?.foto_perfil?.[0]?.filename;
    if (fotoPerfil) {
      await conn.query(
        'UPDATE persona SET foto_perfil = ? WHERE id = ?',
        [fotoPerfil, personaId]
      );
    }

    if (userRol === 'cliente') {
      await conn.query(
        'UPDATE cliente_hogar SET localidad_id = ? WHERE id = ?',
        [localidad_id, personaId]
      );
    } else if (userRol === 'profesional') {
      if (!presentacion || String(presentacion).trim() === '') {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'La presentación es obligatoria.'
        });
      }

      await conn.query(
        'UPDATE profesional SET presentacion = ?, localidad_id = ? WHERE id = ?',
        [presentacion, localidad_id, personaId]
      );

      let tipoIds = req.body.tipo_profesional_ids ?? req.body['tipo_profesional_ids[]'];
      if (!Array.isArray(tipoIds)) {
        tipoIds = tipoIds ? [tipoIds] : [];
      }
      tipoIds = tipoIds.map(id => parseInt(id, 10)).filter(id => !Number.isNaN(id));
      if (tipoIds.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un tipo de profesional.'
        });
      }

      const activos = await TipoProfesional.getActive();
      const activosIds = new Set(activos.map(t => t.id));
      const invalidos = tipoIds.filter(id => !activosIds.has(id));
      if (invalidos.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'Uno o más tipos de profesional no están disponibles.'
        });
      }

      await conn.query('DELETE FROM profesional_tipo WHERE profesional_id = ?', [personaId]);
      for (const tipoId of tipoIds) {
        await conn.query(
          'INSERT INTO profesional_tipo (profesional_id, tipo_profesional_id) VALUES (?, ?)',
          [personaId, tipoId]
        );
      }
    }

    await conn.commit();
    conn.release();

    const [updatedRows] = await pool.query(
      `SELECT u.id, u.correo, u.nombre_usuario, u.rol, p.nombre_apellido, p.foto_perfil
       FROM usuario u
       LEFT JOIN persona p ON u.id = p.usuario_id
       WHERE u.id = ?`,
      [usuario_id]
    );

    return res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: updatedRows[0]
    });
  } catch (error) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    console.error('Error en updatePerfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil.'
    });
  }
};
