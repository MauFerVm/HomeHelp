const db = require('../config/db');
const { hashPassword, isBcryptHash } = require('../utils/password');

(async () => {
  try {
    const [rows] = await db.query('SELECT id, contraseña FROM usuario');
    let migrated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (isBcryptHash(row.contraseña)) {
        skipped++;
        continue;
      }
      const hash = await hashPassword(row.contraseña);
      await db.query('UPDATE usuario SET contraseña = ? WHERE id = ?', [hash, row.id]);
      migrated++;
      console.log(`Usuario ${row.id} migrado`);
    }

    console.log(`Listo: ${migrated} migrados, ${skipped} ya hasheados.`);
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
})();
