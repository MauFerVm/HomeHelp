// Este archivo gestiona la conexión a MySQL usando promesas para poder usar async/await
const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'vale',
  password: '1234',
  database: 'home_help',
});

module.exports = pool.promise();