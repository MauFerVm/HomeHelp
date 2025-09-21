const db = require('../config/db');

class Persona {
  constructor({ id = null, nombre_apellido, fecha_nacimiento, foto_perfil = null, usuario_id }) {
    this.id = id;
    this.nombre_apellido = nombre_apellido;
    this.fecha_nacimiento = fecha_nacimiento;
    this.foto_perfil = foto_perfil;
    this.usuario_id = usuario_id;
  }

  /**
   * Crea una nueva persona en la base de datos.
   * @param {{nombre_apellido: string, fecha_nacimiento: string (YYYY-MM-DD), foto_perfil?: string, usuario_id: number}} data
   * @param {any} [connection] - conexión opcional para transacciones
   * @returns {Promise<Persona>}
   */
  static async crearPersona(data, connection = null) {
    const conn = connection || db;

    const [result] = await conn.query(
      'INSERT INTO persona (nombre_apellido, fecha_nacimiento, foto_perfil, usuario_id) VALUES (?, ?, ?, ?)',
      [
        data.nombre_apellido,
        data.fecha_nacimiento,
        data.foto_perfil || null,
        data.usuario_id
      ]
    );

    return new Persona({
      id: result.insertId,
      ...data
    });
  }

    /**
   * Buscar persona por su id
   * @param {number} id
   * @returns {Promise<Persona|null>}
   */
  static async buscarPorId(id) {
  const [rows] = await db.query(
    `SELECT id, nombre_apellido, fecha_nacimiento, foto_perfil, usuario_id
     FROM persona WHERE id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  return new Persona(rows[0]);
}

  /**

  /**
   * toJSON: convierte a objeto plano para enviar al frontend
   */
  toJSON() {
    return {
      id: this.id,
      nombre_apellido: this.nombre_apellido,
      fecha_nacimiento: this.fecha_nacimiento,
      foto_perfil: this.foto_perfil,
      usuario_id: this.usuario_id
    };
  }
}

module.exports = Persona;
