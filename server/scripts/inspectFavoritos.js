const db = require('../config/db');

(async () => {
  const [persona] = await db.query('SHOW CREATE TABLE persona');
  const [cliente] = await db.query('SHOW CREATE TABLE cliente_hogar');
  const [profesional] = await db.query('SHOW CREATE TABLE profesional');
  console.log(persona[0]['Create Table']);
  console.log('---');
  console.log(cliente[0]['Create Table']);
  console.log('---');
  console.log(profesional[0]['Create Table']);
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
