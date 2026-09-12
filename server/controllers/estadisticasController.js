// controllers/estadisticasController.js
const estadisticasModel = require('../models/estadisticasModel');

const PERIODOS_VALIDOS = ['1m', '3m', '6m', 'custom'];

const pad = (value) => String(value).padStart(2, '0');

const formatMysqlDateTime = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const parseDateOnly = (value, endOfDay = false) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {
        return null;
    }

    if (endOfDay) {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }

    return date;
};

const resolverRangoFechas = (periodo, desde, hasta) => {
    const periodoNormalizado = String(periodo || '1m').toLowerCase();

    if (!PERIODOS_VALIDOS.includes(periodoNormalizado)) {
        const error = new Error('Período inválido. Usá 1m, 3m, 6m o custom.');
        error.statusCode = 400;
        throw error;
    }

    if (periodoNormalizado === 'custom') {
        const fechaDesde = parseDateOnly(desde, false);
        const fechaHasta = parseDateOnly(hasta, true);

        if (!fechaDesde || !fechaHasta) {
            const error = new Error('Para un rango personalizado debés indicar fechas válidas (desde y hasta).');
            error.statusCode = 400;
            throw error;
        }

        if (fechaDesde > fechaHasta) {
            const error = new Error('La fecha "desde" no puede ser posterior a la fecha "hasta".');
            error.statusCode = 400;
            throw error;
        }

        return {
            periodo: periodoNormalizado,
            desde: formatMysqlDateTime(fechaDesde),
            hasta: formatMysqlDateTime(fechaHasta)
        };
    }

    const meses = periodoNormalizado === '3m' ? 3 : periodoNormalizado === '6m' ? 6 : 1;
    const fechaHasta = new Date();
    fechaHasta.setHours(23, 59, 59, 999);

    const fechaDesde = new Date();
    fechaDesde.setMonth(fechaDesde.getMonth() - meses);
    fechaDesde.setHours(0, 0, 0, 0);

    return {
        periodo: periodoNormalizado,
        desde: formatMysqlDateTime(fechaDesde),
        hasta: formatMysqlDateTime(fechaHasta)
    };
};

/**
 * Meses calendario cerrados: 1M = mes actual completo,
 * 3M = mes actual + 2 anteriores, 6M = mes actual + 5 anteriores.
 * No altera los rangos móviles de presupuestos/calificaciones.
 */
const resolverRangoCalendario = (periodo, desde, hasta) => {
    const periodoNormalizado = String(periodo || '1m').toLowerCase();

    if (!PERIODOS_VALIDOS.includes(periodoNormalizado)) {
        const error = new Error('Período inválido. Usá 1m, 3m, 6m o custom.');
        error.statusCode = 400;
        throw error;
    }

    if (periodoNormalizado === 'custom') {
        return resolverRangoFechas(periodoNormalizado, desde, hasta);
    }

    const meses = periodoNormalizado === '3m' ? 3 : periodoNormalizado === '6m' ? 6 : 1;
    const hoy = new Date();
    const fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1, 0, 0, 0, 0);
    const fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
        periodo: periodoNormalizado,
        desde: formatMysqlDateTime(fechaDesde),
        hasta: formatMysqlDateTime(fechaHasta)
    };
};

const redondear = (valor, decimales = 2) => {
    const factor = 10 ** decimales;
    return Math.round((valor + Number.EPSILON) * factor) / factor;
};

const calcularVariacion = (montoPropio, montoGanador) => {
    const propio = Number(montoPropio);
    const ganador = Number(montoGanador);

    if (!Number.isFinite(propio) || !Number.isFinite(ganador) || ganador === 0) {
        return null;
    }

    return redondear(((propio - ganador) / ganador) * 100);
};

const clasificarFila = (row, profesionalPersonaId) => {
    const montoPropio = Number(row.monto_propio);
    const tieneGanador = row.presupuesto_ganador_id != null;
    const ganoActual = tieneGanador && Number(row.ganador_persona_id) === Number(profesionalPersonaId);

    if (ganoActual) {
        return {
            caso: 'ganado',
            estado: 'Ganaste',
            monto_aceptado: montoPropio,
            variacion_porcentual: 0,
            variacion_etiqueta: 'Tu presupuesto fue el elegido',
            variacion_sentido: 'igual'
        };
    }

    if (tieneGanador) {
        const montoGanador = Number(row.monto_ganador);
        const variacion = calcularVariacion(montoPropio, montoGanador);
        let sentido = 'igual';
        let etiqueta = 'Mismo monto que el aceptado';

        if (variacion !== null && variacion > 0) {
            sentido = 'mas_alto';
            etiqueta = `${variacion}% más alto que el aceptado`;
        } else if (variacion !== null && variacion < 0) {
            sentido = 'mas_bajo';
            etiqueta = `${Math.abs(variacion)}% más bajo que el aceptado`;
        }

        return {
            caso: 'perdido',
            estado: 'Ganó otro profesional',
            monto_aceptado: Number.isFinite(montoGanador) ? montoGanador : null,
            variacion_porcentual: variacion,
            variacion_etiqueta: etiqueta,
            variacion_sentido: sentido
        };
    }

    return {
        caso: 'en_espera',
        estado: 'En espera de resolución',
        monto_aceptado: null,
        variacion_porcentual: null,
        variacion_etiqueta: 'En espera de resolución',
        variacion_sentido: 'pendiente'
    };
};

const getComparacionPresupuestos = async (req, res) => {
    try {
        const profesionalPersonaId = Number(req.params.profesionalPersonaId);
        const { periodo, desde, hasta } = req.query;

        if (!profesionalPersonaId || Number.isNaN(profesionalPersonaId)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador del profesional es inválido'
            });
        }

        const rango = resolverRangoFechas(periodo, desde, hasta);
        const rows = await estadisticasModel.getComparacionPresupuestos(
            profesionalPersonaId,
            rango.desde,
            rango.hasta
        );

        const items = rows.map((row) => {
            const clasificacion = clasificarFila(row, profesionalPersonaId);

            return {
                presupuesto_id: row.presupuesto_id,
                solicitud_id: row.solicitud_id,
                solicitud_titulo: row.solicitud_titulo,
                fecha_envio: row.creado_en,
                monto_propio: Number(row.monto_propio),
                monto_aceptado: clasificacion.monto_aceptado,
                caso: clasificacion.caso,
                estado: clasificacion.estado,
                variacion_porcentual: clasificacion.variacion_porcentual,
                variacion_etiqueta: clasificacion.variacion_etiqueta,
                variacion_sentido: clasificacion.variacion_sentido
            };
        });

        const totalEnviados = items.length;
        const totalGanados = items.filter((item) => item.caso === 'ganado').length;
        const noAdjudicados = items.filter((item) => item.caso === 'perdido' && item.variacion_porcentual !== null);
        const sumaDesvio = noAdjudicados.reduce((acc, item) => acc + item.variacion_porcentual, 0);

        const kpis = {
            total_enviados: totalEnviados,
            tasa_conversion: totalEnviados > 0
                ? redondear((totalGanados / totalEnviados) * 100)
                : 0,
            promedio_desvio: noAdjudicados.length > 0
                ? redondear(sumaDesvio / noAdjudicados.length)
                : null,
            total_ganados: totalGanados,
            total_no_adjudicados: noAdjudicados.length,
            total_en_espera: items.filter((item) => item.caso === 'en_espera').length
        };

        res.json({
            success: true,
            data: {
                periodo: rango.periodo,
                desde: rango.desde,
                hasta: rango.hasta,
                kpis,
                items
            }
        });
    } catch (error) {
        console.error('Error al obtener comparación de presupuestos:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getCalificacionesReputacion = async (req, res) => {
    try {
        const profesionalPersonaId = Number(req.params.profesionalPersonaId);
        const { periodo, desde, hasta } = req.query;

        if (!profesionalPersonaId || Number.isNaN(profesionalPersonaId)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador del profesional es inválido'
            });
        }

        const rango = resolverRangoFechas(periodo, desde, hasta);
        const rows = await estadisticasModel.getCalificacionesReputacion(
            profesionalPersonaId,
            rango.desde,
            rango.hasta
        );

        const totalResenas = rows.length;
        const suma = rows.reduce((acc, row) => acc + Number(row.puntuacion), 0);
        const promedio = totalResenas > 0 ? redondear(suma / totalResenas, 1) : 0;

        const distribucion = [5, 4, 3, 2, 1].map((estrellas) => {
            const cantidad = rows.filter((row) => Number(row.puntuacion) === estrellas).length;
            return {
                estrellas,
                cantidad,
                porcentaje: totalResenas > 0 ? redondear((cantidad / totalResenas) * 100, 1) : 0
            };
        });

        const ultimas = rows.map((row) => ({
            id: row.id,
            puntuacion: Number(row.puntuacion),
            fecha: row.creado_en,
            comentario: row.comentario || null,
            calificador_nombre: row.calificador_nombre || null,
            solicitud_titulo: row.solicitud_titulo || null
        }));

        res.json({
            success: true,
            data: {
                periodo: rango.periodo,
                desde: rango.desde,
                hasta: rango.hasta,
                promedio,
                total_resenas: totalResenas,
                distribucion,
                ultimas
            }
        });
    } catch (error) {
        console.error('Error al obtener calificaciones y reputación:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const MESES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatMysqlDate = (date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toLocalDate = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const startOfWeekMonday = (date) => {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = result.getDay();
    const diff = day === 0 ? 6 : day - 1;
    result.setDate(result.getDate() - diff);
    return result;
};

const formatDiaCorto = (date) => {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
};

const resolverGranularidad = (periodo, fechaDesde, fechaHasta) => {
    if (periodo === '1m') {
        return 'semana';
    }

    if (periodo === '3m' || periodo === '6m') {
        return 'mes';
    }

    const milisPorDia = 24 * 60 * 60 * 1000;
    const dias = Math.round((fechaHasta - fechaDesde) / milisPorDia);
    return dias < 60 ? 'semana' : 'mes';
};

const generarIntervalos = (fechaDesde, fechaHasta, granularidad) => {
    const intervalos = [];

    if (granularidad === 'mes') {
        const cursor = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), 1);
        const ultimo = new Date(fechaHasta.getFullYear(), fechaHasta.getMonth(), 1);

        while (cursor <= ultimo) {
            intervalos.push({
                clave: `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-01`,
                etiqueta: `${MESES_ES[cursor.getMonth()]} ${cursor.getFullYear()}`
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }

        return intervalos;
    }

    const cursor = startOfWeekMonday(fechaDesde);
    let numeroSemana = 1;

    while (cursor <= fechaHasta) {
        const finSemana = new Date(cursor);
        finSemana.setDate(finSemana.getDate() + 6);

        const visibleInicio = cursor < fechaDesde ? fechaDesde : new Date(cursor);
        const visibleFin = finSemana > fechaHasta ? fechaHasta : finSemana;

        if (visibleInicio <= visibleFin) {
            intervalos.push({
                clave: formatMysqlDate(cursor),
                etiqueta: `Semana ${numeroSemana} (${formatDiaCorto(visibleInicio)} – ${formatDiaCorto(visibleFin)})`
            });
            numeroSemana += 1;
        }

        cursor.setDate(cursor.getDate() + 7);
    }

    return intervalos;
};

const getIngresosAcumulados = async (req, res) => {
    try {
        const profesionalPersonaId = Number(req.params.profesionalPersonaId);
        const { periodo, desde, hasta } = req.query;

        if (!profesionalPersonaId || Number.isNaN(profesionalPersonaId)) {
            return res.status(400).json({
                success: false,
                message: 'El identificador del profesional es inválido'
            });
        }

        const rango = resolverRangoCalendario(periodo, desde, hasta);
        const fechaDesde = toLocalDate(rango.desde);
        const fechaHasta = toLocalDate(rango.hasta);
        const granularidad = resolverGranularidad(rango.periodo, fechaDesde, fechaHasta);

        const rows = await estadisticasModel.getIngresosAgrupados(
            profesionalPersonaId,
            formatMysqlDate(fechaDesde),
            formatMysqlDate(fechaHasta),
            granularidad
        );

        const montosPorClave = new Map(
            rows.map((row) => [
                String(row.periodo_inicio).slice(0, 10),
                {
                    ingresos: Number(row.ingresos) || 0,
                    cantidad: Number(row.cantidad) || 0
                }
            ])
        );

        const intervalos = generarIntervalos(fechaDesde, fechaHasta, granularidad).map((intervalo) => {
            const datos = montosPorClave.get(intervalo.clave) || { ingresos: 0, cantidad: 0 };
            return {
                clave: intervalo.clave,
                etiqueta: intervalo.etiqueta,
                ingresos: redondear(datos.ingresos, 2),
                cantidad: datos.cantidad
            };
        });

        const totalRecaudado = redondear(
            intervalos.reduce((acc, item) => acc + item.ingresos, 0),
            2
        );
        const totalServicios = intervalos.reduce((acc, item) => acc + item.cantidad, 0);

        res.json({
            success: true,
            data: {
                periodo: rango.periodo,
                desde: formatMysqlDate(fechaDesde),
                hasta: formatMysqlDate(fechaHasta),
                granularidad,
                kpis: {
                    total_recaudado: totalRecaudado,
                    total_servicios: totalServicios,
                    ticket_promedio: totalServicios > 0
                        ? redondear(totalRecaudado / totalServicios, 2)
                        : null
                },
                intervalos
            }
        });
    } catch (error) {
        console.error('Error al obtener ingresos acumulados:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: statusCode === 400 ? error.message : 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getComparacionPresupuestos,
    getCalificacionesReputacion,
    getIngresosAcumulados
};
