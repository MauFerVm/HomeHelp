// Define la clase User y encapsula toda la lógica de acceso a la tabla `users`
const db = require('../config/db');

class Usuario {
  constructor({ id = null, correo, nombre_usuario, contraseña, fecha_creacion = null, activo = true }) {
    this.id = id;
    this.correo = correo;
    this.nombre_usuario = nombre_usuario;
    this.contraseña = contraseña;
    this.fecha_creacion = fecha_creacion;
    this.activo = activo;
  }

  /**
   * createUser: inserta un nuevo registro en la DB y devuelve una instancia de User
   * @param {{email: string, username: string, password: string}} data
   * @returns {Promise<User>}
   */
  static async crearUsuario({ correo, nombre_usuario, contraseña }) {
    const [result] = await db.query(
      'INSERT INTO usuario (correo, nombre_usuario, contraseña, fecha_creacion, activo) VALUES (?,?,?, NOW(), TRUE)',
      [correo, nombre_usuario, contraseña]
    );
    return new Usuario({ id: result.insertId, correo, nombre_usuario, contraseña });
  }

  /**
   * findByCredentials: busca un usuario por username+password
   * @param {string} username
   * @param {string} password
   * @returns {Promise<User|null>}
   */
  static async buscarPorCredenciales(nombre_usuario, contraseña) {
    const [rows] = await db.query(
      'SELECT * FROM usuario WHERE nombre_usuario = ? AND contraseña = ?',
      [nombre_usuario, contraseña]
    );
    if (rows.length === 0) return null;
    return new Usuario(rows[0]);
  }

  /**
   * toJSON: filtra campos sensibles antes de enviar al cliente
   * @returns {{id: number, email: string, username: string}}
   */
  toJSON() {
    return {
      id: this.id,
      correo: this.correo,
      nombre_usuario: this.nombre_usuario,
      fecha_creacion: this.fecha_creacion,
      activo: this.activo
    };
  }
}

module.exports = Usuario;