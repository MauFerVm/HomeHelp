// Define la clase User y encapsula toda la lógica de acceso a la tabla `users`
const db = require('../config/db');

class Usuario {
  constructor({ id = null, correo, nombre_usuario, contraseña, fecha_creacion = null, activo = true, rol = 'cliente' }) {
    this.id = id;
    this.correo = correo;
    this.nombre_usuario = nombre_usuario;
    this.contraseña = contraseña;
    this.fecha_creacion = fecha_creacion;
    this.activo = activo;
    this.rol = rol;
  }

  static async crearUsuario({ correo, nombre_usuario, contraseña, rol = 'cliente' }) {
    const [result] = await db.query(
      // IMPORTANTE: hay 6 columnas, por eso 4 valores + NOW()/TRUE + ? para rol
      'INSERT INTO usuario (correo, nombre_usuario, contraseña, fecha_creacion, activo, rol) VALUES (?,?,?, NOW(), TRUE, ?)',
      [correo, nombre_usuario, contraseña, rol]
    );
    return new Usuario({ id: result.insertId, correo, nombre_usuario, contraseña, rol });
  }

  static async buscarPorCredenciales(nombre_usuario, contraseña) {
    const [rows] = await db.query(
      'SELECT * FROM usuario WHERE nombre_usuario = ? AND contraseña = ?',
      [nombre_usuario, contraseña]
    );
    if (rows.length === 0) return null;
    return new Usuario(rows[0]);
  }

  toJSON() {
    return {
      id: this.id,
      correo: this.correo,
      nombre_usuario: this.nombre_usuario,
      fecha_creacion: this.fecha_creacion,
      activo: this.activo,
      rol: this.rol
    };
  }
}

module.exports = Usuario;
