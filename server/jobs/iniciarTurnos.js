const db = require('../config/db');

const INTERVALO_MS = 10 * 60 * 1000;
const ESTADOS_A_INICIAR = ['pendiente', 'reprogramado', 'represupuestada'];

let ejecutando = false;

const horaLocal = () => new Date().toLocaleString('es-AR', { hour12: false });

const registrarEstadoSolicitud = async (executor, solicitudId, nombreEstado, notas) => {
    const [estadoRows] = await executor.execute(
        'SELECT id, vencimiento_dias FROM estado_sol_servicio WHERE nombre = ?',
        [nombreEstado]
    );

    if (estadoRows.length === 0) {
        throw new Error(`No se encontró el estado "${nombreEstado}" de la solicitud`);
    }

    const estado = estadoRows[0];
    const fechaCreacion = new Date();
    let fechaVencimiento = null;

    if (Number(estado.vencimiento_dias) > 0) {
        fechaVencimiento = new Date(fechaCreacion);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + Number(estado.vencimiento_dias));
    }

    await executor.execute(
        `INSERT INTO historial_servicio
         (solicitud_id, fecha_creacion, fecha_vencimiento, estado_id, notas)
         VALUES (?, ?, ?, ?, ?)`,
        [solicitudId, fechaCreacion, fechaVencimiento, estado.id, notas]
    );

    await executor.execute(
        'UPDATE solicitud_servicio SET estado_id = ? WHERE id = ?',
        [estado.id, solicitudId]
    );
};

const chequearTurnosIniciados = async () => {
    if (ejecutando) {
        console.log(`[turnos] ${horaLocal()} — el control anterior sigue en curso, se omite este`);
        return;
    }
    ejecutando = true;
    console.log(`[turnos] ${horaLocal()} — inicia el control de turnos`);

    let iniciadas = 0;

    try {
        const [ordenes] = await db.execute(
            `SELECT id, solicitud_id, estado
             FROM orden_de_trabajo
             WHERE is_active = 1
               AND estado IN (?, ?, ?)
               AND fecha_programada IS NOT NULL
               AND horarioInicio IS NOT NULL
               AND TIMESTAMP(DATE(fecha_programada), horarioInicio) <= NOW()`,
            ESTADOS_A_INICIAR
        );

        for (const orden of ordenes) {
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                const [actualizacion] = await connection.execute(
                    `UPDATE orden_de_trabajo
                     SET estado = 'en_curso'
                     WHERE id = ?
                       AND is_active = 1
                       AND estado = ?`,
                    [orden.id, orden.estado]
                );

                if (actualizacion.affectedRows === 0) {
                    await connection.rollback();
                    continue;
                }

                await connection.execute(
                    `INSERT INTO historial_orden_trabajo
                     (orden_id, estado_anterior, estado_nuevo, notas)
                     VALUES (?, ?, 'en_curso', ?)`,
                    [
                        orden.id,
                        orden.estado,
                        'Llegó la fecha y hora del turno. La orden pasó a en curso'
                    ]
                );

                await registrarEstadoSolicitud(
                    connection,
                    orden.solicitud_id,
                    'en_progreso',
                    'Llegó la fecha y hora del turno. La solicitud está en progreso'
                );

                await connection.commit();
                iniciadas += 1;
                console.log(`[turnos] Orden ${orden.id} pasó a en curso (turno iniciado)`);
            } catch (error) {
                await connection.rollback();
                console.error(`Error al iniciar la orden ${orden.id}:`, error);
            } finally {
                connection.release();
            }
        }
        const siguiente = new Date(Date.now() + INTERVALO_MS).toLocaleString('es-AR', { hour12: false });
        console.log(`[turnos] ${horaLocal()} — control finalizado. Órdenes pasadas a en curso: ${iniciadas}. Próximo control: ${siguiente}`);
    } catch (error) {
        console.error(`[turnos] ${horaLocal()} — error en el control de turnos:`, error);
    } finally {
        ejecutando = false;
    }
};

const iniciarChequeoTurnos = () => {
    console.log(`[turnos] ${horaLocal()} — chequeo de turnos activo. Control al iniciar y luego cada 10 minutos`);
    chequearTurnosIniciados();
    const timer = setInterval(chequearTurnosIniciados, INTERVALO_MS);
    if (typeof timer.unref === 'function') {
        timer.unref();
    }
    return timer;
};

module.exports = {
    iniciarChequeoTurnos,
    chequearTurnosIniciados
};
