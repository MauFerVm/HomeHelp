// Define la clase User y encapsula toda la lógica de acceso a la tabla `users`
const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');

class Usuario {
  constructor({ id = null, correo, nombre_usuario, contraseña, fecha_creacion = null, activo = true, rol = 'cliente', foto_perfil = null, nombre_apellido = null }) {
    this.id = id;
    this.correo = correo;
    this.nombre_usuario = nombre_usuario;
    this.contraseña = contraseña;
    this.fecha_creacion = fecha_creacion;
    this.activo = activo;
    this.rol = rol;
    this.foto_perfil = foto_perfil;
    this.nombre_apellido = nombre_apellido;
  }

  static async crearUsuario({ correo, nombre_usuario, contraseña, rol = 'cliente' }) {
    const hash = await hashPassword(contraseña);
    const [result] = await db.query(
      // IMPORTANTE: hay 6 columnas, por eso 4 valores + NOW()/TRUE + ? para rol
      'INSERT INTO usuario (correo, nombre_usuario, contraseña, fecha_creacion, activo, rol) VALUES (?,?,?, NOW(), TRUE, ?)',
      [correo, nombre_usuario, hash, rol]
    );
    return new Usuario({ id: result.insertId, correo, nombre_usuario, contraseña: hash, rol });
  }

  static async buscarPorCredenciales(nombre_usuario, contraseña) {
    const [rows] = await db.query(
      `SELECT u.*, p.foto_perfil, p.nombre_apellido 
       FROM usuario u 
       LEFT JOIN persona p ON u.id = p.usuario_id 
       WHERE u.nombre_usuario = ?`,
      [nombre_usuario]
    );
    if (rows.length === 0) return null;

    const ok = await comparePassword(contraseña, rows[0].contraseña);
    if (!ok) return null;

    return new Usuario(rows[0]);
  }

  toJSON() {
    return {
      id: this.id,
      correo: this.correo,
      nombre_usuario: this.nombre_usuario,
      fecha_creacion: this.fecha_creacion,
      activo: this.activo,
      rol: this.rol,
      foto_perfil: this.foto_perfil,
      nombre_apellido: this.nombre_apellido
    };
  }
}

module.exports = Usuario;
