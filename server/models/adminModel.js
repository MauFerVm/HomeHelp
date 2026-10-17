const db = require('../config/db');

const toBool = (valor) => Number(valor) === 1;

const toNumber = (valor) => {
    if (valor == null || valor === '') return 0;
    const numero = Number(valor);
    return Number.isNaN(numero) ? 0 : numero;
};

const mapUsuario = (row) => ({
    id: row.id,
    correo: row.correo,
    nombre_usuario: row.nombre_usuario,
    fecha_creacion: row.fecha_creacion,
    activo: toBool(row.activo),
    rol: row.rol,
    persona_id: row.persona_id,
    nombre_apellido: row.nombre_apellido,
    foto_perfil: row.foto_perfil
});

const listarUsuarios = async () => {
    const [rows] = await db.execute(`
        SELECT
            u.id,
            u.correo,
            u.nombre_usuario,
            DATE_FORMAT(u.fecha_creacion, '%Y-%m-%d') AS fecha_creacion,
            u.activo,
            u.rol,
            p.id AS persona_id,
            p.nombre_apellido,
            p.foto_perfil
        FROM usuario u
        LEFT JOIN persona p ON p.usuario_id = u.id
        ORDER BY u.fecha_creacion DESC, u.id DESC
    `);

    return rows.map(mapUsuario);
};

const listarClientes = async () => {
    const [rows] = await db.execute(`
        SELECT
            u.id,
            u.correo,
            u.nombre_usuario,
            DATE_FORMAT(u.fecha_creacion, '%Y-%m-%d') AS fecha_creacion,
            u.activo,
            u.rol,
            p.id AS persona_id,
            p.nombre_apellido,
            p.foto_perfil,
            ch.direccion,
            l.nombre AS localidad,
            prov.nombre AS provincia,
            (
                SELECT COUNT(*)
                FROM solicitud_servicio ss
                WHERE ss.cliente_persona_id = p.id
            ) AS solicitudes,
            (
                SELECT COUNT(*)
                FROM orden_de_trabajo ot
                WHERE ot.cliente_persona_id = p.id
                  AND ot.is_active = 1
            ) AS ordenes,
            (
                SELECT ROUND(AVG(c.puntuacion), 1)
                FROM calificaciones c
                WHERE c.calificado_persona_id = p.id
                  AND c.activo = 1
            ) AS calificacion,
            (
                SELECT COUNT(*)
                FROM calificaciones c
                WHERE c.calificado_persona_id = p.id
                  AND c.activo = 1
            ) AS resenas
        FROM usuario u
        LEFT JOIN persona p ON p.usuario_id = u.id
        LEFT JOIN cliente_hogar ch ON ch.id = p.id
        LEFT JOIN localidad l ON l.id = ch.localidad_id
        LEFT JOIN provincia prov ON prov.id = l.provincia_id
        WHERE u.rol = 'cliente'
        ORDER BY p.nombre_apellido ASC, u.nombre_usuario ASC
    `);

    return rows.map((row) => ({
        ...mapUsuario(row),
        direccion: row.direccion,
        localidad: row.localidad,
        provincia: row.provincia,
        solicitudes: toNumber(row.solicitudes),
        ordenes: toNumber(row.ordenes),
        calificacion: row.calificacion == null ? null : Number(row.calificacion),
        resenas: toNumber(row.resenas)
    }));
};

const existeUsuario = async (id, conn = db) => {
    const [rows] = await conn.execute('SELECT id FROM usuario WHERE id = ?', [id]);
    return rows.length > 0;
};

const actualizarEstado = async (id, activo) => {
    const [result] = await db.execute(
        'UPDATE usuario SET activo = ? WHERE id = ?',
        [activo ? 1 : 0, id]
    );
    return result.affectedRows > 0;
};

const actualizarUsuario = async (id, { correo, nombre_usuario, nombre_apellido }) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const existe = await existeUsuario(id, conn);
        if (!existe) {
            await conn.rollback();
            return false;
        }

        const [usuariosRepetidos] = await conn.execute(
            'SELECT id FROM usuario WHERE nombre_usuario = ? AND id <> ?',
            [nombre_usuario, id]
        );
        if (usuariosRepetidos.length > 0) {
            const error = new Error('Ese nombre de usuario ya está en uso');
            error.status = 409;
            throw error;
        }

        const [correosRepetidos] = await conn.execute(
            'SELECT id FROM usuario WHERE correo = ? AND id <> ?',
            [correo, id]
        );
        if (correosRepetidos.length > 0) {
            const error = new Error('Ese correo ya está en uso');
            error.status = 409;
            throw error;
        }

        await conn.execute(
            'UPDATE usuario SET correo = ?, nombre_usuario = ? WHERE id = ?',
            [correo, nombre_usuario, id]
        );

        if (nombre_apellido) {
            await conn.execute(
                'UPDATE persona SET nombre_apellido = ? WHERE usuario_id = ?',
                [nombre_apellido, id]
            );
        }

        await conn.commit();
        return true;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

const listarProfesionales = async () => {
    const [rows] = await db.execute(`
        SELECT
            u.id,
            u.correo,
            u.nombre_usuario,
            DATE_FORMAT(u.fecha_creacion, '%Y-%m-%d') AS fecha_creacion,
            u.activo,
            u.rol,
            p.id AS persona_id,
            p.nombre_apellido,
            p.foto_perfil,
            prof.presentacion,
            prof.instituto,
            l.nombre AS localidad,
            prov.nombre AS provincia,
            (
                SELECT GROUP_CONCAT(tp.nombre ORDER BY tp.nombre SEPARATOR '||')
                FROM profesional_tipo pt
                INNER JOIN tipo_profesional tp ON tp.id = pt.tipo_profesional_id
                WHERE pt.profesional_id = p.id
            ) AS categorias,
            (
                SELECT ROUND(AVG(c.puntuacion), 1)
                FROM calificaciones c
                WHERE c.calificado_persona_id = p.id
                  AND c.activo = 1
            ) AS calificacion,
            (
                SELECT COUNT(*)
                FROM calificaciones c
                WHERE c.calificado_persona_id = p.id
                  AND c.activo = 1
            ) AS resenas,
            (
                SELECT COUNT(*)
                FROM orden_de_trabajo ot
                WHERE ot.profesional_id = p.id
                  AND ot.is_active = 1
                  AND ot.estado IN ('completado', 'cerradoprofesional', 'cerradocliente')
            ) AS trabajos
        FROM usuario u
        LEFT JOIN persona p ON p.usuario_id = u.id
        LEFT JOIN profesional prof ON prof.id = p.id
        LEFT JOIN localidad l ON l.id = prof.localidad_id
        LEFT JOIN provincia prov ON prov.id = l.provincia_id
        WHERE u.rol = 'profesional'
        ORDER BY p.nombre_apellido ASC, u.nombre_usuario ASC
    `);

    return rows.map((row) => ({
        ...mapUsuario(row),
        presentacion: row.presentacion,
        instituto: row.instituto,
        localidad: row.localidad,
        provincia: row.provincia,
        categorias: row.categorias
            ? String(row.categorias).split('||').filter(Boolean)
            : [],
        calificacion: row.calificacion == null ? null : Number(row.calificacion),
        resenas: toNumber(row.resenas),
        trabajos: toNumber(row.trabajos)
    }));
};

const ETIQUETAS_ESTADO = {
    abierta: 'Abierta',
    notificada: 'Notificada',
    en_progreso: 'En progreso',
    cerrada: 'Cerrada',
    cancelada: 'Cancelada',
    'presupuesto aceptado': 'Presupuesto aceptado'
};

const obtenerEstadisticasGenerales = async () => {
    const [porCategoria] = await db.execute(`
        SELECT tp.nombre, COUNT(ss.id) AS cantidad
        FROM tipo_profesional tp
        LEFT JOIN solicitud_servicio ss ON ss.tipo_profesional_id = tp.id
        GROUP BY tp.id, tp.nombre
        ORDER BY cantidad DESC, tp.nombre ASC
    `);

    const [porEstado] = await db.execute(`
        SELECT ess.nombre, COUNT(ss.id) AS cantidad
        FROM estado_sol_servicio ess
        LEFT JOIN solicitud_servicio ss ON ss.estado_id = ess.id
        GROUP BY ess.id, ess.nombre
        ORDER BY CASE ess.nombre
            WHEN 'abierta' THEN 1
            WHEN 'notificada' THEN 2
            WHEN 'presupuesto aceptado' THEN 3
            WHEN 'en_progreso' THEN 4
            WHEN 'cerrada' THEN 5
            WHEN 'cancelada' THEN 6
            ELSE 99
        END, ess.id ASC
    `);

    const [porRubro] = await db.execute(`
        SELECT tp.nombre, COUNT(DISTINCT pt.profesional_id) AS cantidad
        FROM tipo_profesional tp
        LEFT JOIN profesional_tipo pt ON pt.tipo_profesional_id = tp.id
        GROUP BY tp.id, tp.nombre
        ORDER BY cantidad DESC, tp.nombre ASC
    `);

    const [totalesRows] = await db.execute(`
        SELECT
            (SELECT COUNT(*) FROM solicitud_servicio) AS solicitudes,
            (SELECT COUNT(DISTINCT profesional_id) FROM profesional_tipo) AS profesionales,
            (SELECT COUNT(*) FROM tipo_profesional WHERE estado = 1) AS rubros
    `);

    const mapCantidad = (rows) => rows.map((row) => ({
        nombre: row.nombre,
        cantidad: toNumber(row.cantidad)
    }));

    return {
        solicitudesPorCategoria: mapCantidad(porCategoria),
        solicitudesPorEstado: porEstado.map((row) => ({
            nombre: row.nombre,
            etiqueta: ETIQUETAS_ESTADO[row.nombre] || row.nombre,
            cantidad: toNumber(row.cantidad)
        })),
        profesionalesPorRubro: mapCantidad(porRubro),
        totales: {
            solicitudes: toNumber(totalesRows[0]?.solicitudes),
            profesionales: toNumber(totalesRows[0]?.profesionales),
            rubros: toNumber(totalesRows[0]?.rubros)
        }
    };
};

const NOMBRES_MES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const PERIODOS_INGRESO = { '1a': 12, '6m': 6, '3m': 3 };

const armarEjeIngresos = (cantidadMeses, hoy = new Date()) => {
    const anioActual = hoy.getFullYear();
    const anioPasado = anioActual - 1;
    const meses = [];

    for (let i = cantidadMeses - 1; i >= 0; i -= 1) {
        const fecha = new Date(anioActual, hoy.getMonth() - i, 1);
        const mes = fecha.getMonth();
        meses.push({
            clave: `${fecha.getFullYear()}-${String(mes + 1).padStart(2, '0')}`,
            nombre: NOMBRES_MES[mes],
            anio: fecha.getFullYear()
        });
    }

    const mesesAnioPasado = meses.filter((item) => item.anio === anioPasado).length;
    const mesesEsteAnio = meses.length - mesesAnioPasado;

    return {
        columnas: meses.length,
        anioPasado,
        anioActual,
        mesesAnioPasado,
        mesesEsteAnio,
        meses
    };
};

const obtenerReporteIngresos = async () => {
    const [categorias] = await db.execute(`
        SELECT id, nombre
        FROM tipo_profesional
        ORDER BY nombre ASC
    `);

    const [movimientos] = await db.execute(`
        SELECT
            DATE_FORMAT(ot.creado_en, '%Y-%m') AS mes,
            tp.id AS categoria_id,
            SUM(ot.monto) AS monto,
            COUNT(*) AS cantidad
        FROM orden_de_trabajo ot
        JOIN solicitud_servicio ss ON ss.id = ot.solicitud_id
        JOIN tipo_profesional tp ON tp.id = ss.tipo_profesional_id
        WHERE ot.is_active = 1
          AND ot.estado IN ('completado', 'cerradoprofesional', 'cerradocliente')
        GROUP BY mes, tp.id
        ORDER BY mes ASC, tp.nombre ASC
    `);

    const ejes = Object.fromEntries(
        Object.entries(PERIODOS_INGRESO).map(([id, cantidad]) => [id, armarEjeIngresos(cantidad)])
    );

    return {
        categorias: categorias.map((categoria) => ({
            id: categoria.id,
            nombre: categoria.nombre
        })),
        movimientos: movimientos.map((row) => ({
            mes: row.mes,
            categoriaId: row.categoria_id,
            monto: toNumber(row.monto),
            cantidad: toNumber(row.cantidad)
        })),
        ejes
    };
};

const obtenerAnalisisUsuarios = async () => {
    const [categorias] = await db.execute(`
        SELECT id, nombre
        FROM tipo_profesional
        ORDER BY nombre ASC
    `);

    const [altas] = await db.execute(`
        SELECT
            DATE_FORMAT(fecha_creacion, '%Y-%m') AS mes,
            rol,
            COUNT(*) AS cantidad
        FROM usuario
        WHERE rol IN ('cliente', 'profesional')
          AND fecha_creacion IS NOT NULL
        GROUP BY mes, rol
        ORDER BY mes ASC
    `);

    const [altasPorTipo] = await db.execute(`
        SELECT
            DATE_FORMAT(u.fecha_creacion, '%Y-%m') AS mes,
            tp.id AS tipo_id,
            COUNT(DISTINCT u.id) AS cantidad
        FROM usuario u
        INNER JOIN persona p ON p.usuario_id = u.id
        INNER JOIN profesional pr ON pr.id = p.id
        INNER JOIN profesional_tipo pt ON pt.profesional_id = pr.id
        INNER JOIN tipo_profesional tp ON tp.id = pt.tipo_profesional_id
        WHERE u.rol = 'profesional'
          AND u.fecha_creacion IS NOT NULL
        GROUP BY mes, tp.id
        ORDER BY mes ASC
    `);

    const ejes = Object.fromEntries(
        Object.entries(PERIODOS_INGRESO).map(([id, cantidad]) => [id, armarEjeIngresos(cantidad)])
    );

    return {
        categorias: categorias.map((categoria) => ({
            id: categoria.id,
            nombre: categoria.nombre
        })),
        altas: altas.map((row) => ({
            mes: row.mes,
            rol: row.rol,
            cantidad: toNumber(row.cantidad)
        })),
        altasPorTipo: altasPorTipo.map((row) => ({
            mes: row.mes,
            tipoId: row.tipo_id,
            cantidad: toNumber(row.cantidad)
        })),
        ejes
    };
};

module.exports = {
    listarUsuarios,
    listarClientes,
    listarProfesionales,
    actualizarEstado,
    actualizarUsuario,
    obtenerEstadisticasGenerales,
    obtenerReporteIngresos,
    obtenerAnalisisUsuarios
};
