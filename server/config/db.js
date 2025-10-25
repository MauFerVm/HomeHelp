// Este archivo gestiona la conexión a MySQL usando promesas para poder usar async/await
const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'vale',
  password: '1234',
  database: 'bd_home_help1',
});

// Exportamos el pool con promesa integrada
module.exports = pool.promise();