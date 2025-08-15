// server/models/clienteHogarModel.js
const db = require('../config/db');

class ClienteHogar {
  constructor({ id, direccion, localidad_id }) {
    this.id = id;
    this.direccion = direccion;
    this.localidad_id = localidad_id;
  }

  /**
   * crear: inserta un registro en cliente_hogar
   * @param {{ id: number, direccion: string, localidad_id: number }} data
   * @param {any} [conn] - conexión opcional para transacción
   */
  static async crear({ id, direccion, localidad_id }, conn = null) {
    const executor = conn || db;
    await executor.query(
      'INSERT INTO cliente_hogar (id, direccion, localidad_id) VALUES (?, ?, ?)',
      [id, direccion, localidad_id]
    );
    return new ClienteHogar({ id, direccion, localidad_id });
  }
}

module.exports = ClienteHogar;
