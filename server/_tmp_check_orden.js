const db = require('./config/db');

(async () => {
    const [trx] = await db.query('SELECT trx_id, trx_state, trx_started, trx_mysql_thread_id, trx_query, trx_rows_modified FROM information_schema.innodb_trx');
    console.log('trx', JSON.stringify(trx, null, 2));

    const [ai] = await db.query(`SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'bd_home_help1' AND TABLE_NAME = 'orden_de_trabajo'`);
    console.log('autoincrement', ai);

    const [pres] = await db.query(`SELECT id, solicitud_id, estado, monto, descripcion, creado_en FROM presupuesto WHERE id = 35`);
    console.log('presupuesto35', JSON.stringify(pres, null, 2));

    const [sol] = await db.query(`SELECT id, titulo, estado_id FROM solicitud_servicio WHERE id = 38`);
    console.log('solicitud38', sol);

    const [hist] = await db.query(`SELECT * FROM historial_orden WHERE orden_id >= 34 ORDER BY id DESC LIMIT 20`).catch?.(() => [[]]);
    process.exit(0);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
