import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import './CalendarioHorarios.css';
import { STATIC_URL, API_URL } from '../services/apiConfig';

// ─── Constantes de la escala temporal ────────────────────────────────────────
const HORA_INICIO_DIA = 8;   // 08:00
const HORA_FIN_DIA    = 24;  // 24:00 (medianoche)
const SLOT_HEIGHT     = 27;  // Altura en px de cada celda de 30 min (75% de 36px)

// Generar los 32 slots fijos de 30 min desde las 08:00 hasta las 23:30
const HORAS_SLOTS = [];
for (let h = HORA_INICIO_DIA; h < HORA_FIN_DIA; h++) {
    HORAS_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    HORAS_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseTime = (str) => {
    if (!str) return null;
    const [h, m] = str.split(':').map(Number);
    return h + m / 60;
};

const formatTime = (dec) => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Calcula el slot ajustado dentro de la jornada:
 * - Si timeDec + duracionHoras <= finJornada, inicia normalmente en timeDec.
 * - Si timeDec + duracionHoras > finJornada, ajusta hacia arriba: finJornada - duracionHoras.
 */
const calcularHorarioSlot = (timeStr, diaEstado, duracionHoras) => {
    if (!diaEstado || diaEstado.shiftStart === null || diaEstado.shiftEnd === null) return null;
    const timeDec = parseTime(timeStr);
    const dentroDeTurno = timeDec >= diaEstado.shiftStart && timeDec < diaEstado.shiftEnd;
    if (!dentroDeTurno) return null;

    let inicioDec = timeDec;
    if (timeDec + duracionHoras > diaEstado.shiftEnd + 0.0001) {
        inicioDec = diaEstado.shiftEnd - duracionHoras;
    }

    const snappedInicioDec = Math.max(diaEstado.shiftStart, Math.round(inicioDec * 2) / 2);
    const finalFinDec = snappedInicioDec + duracionHoras;

    return {
        horaInicio: formatTime(snappedInicioDec),
        horaFin: formatTime(finalFinDec)
    };
};

// ─── Componente principal ─────────────────────────────────────────────────────
const CalendarioHorarios = ({
    profesionalId,
    duracion,
    onHorarioSeleccionado,
    onCerrar,
    ordenId = null,
    titulo = 'Seleccionar Horario',
    textoConfirmar = 'Confirmar Horario'
}) => {
    const [semanaActual, setSemanaActual]               = useState(0); // 0 = semana actual, 1-3 siguientes
    const [horariosDisponibles, setHorariosDisponibles] = useState({});
    const [configuracion, setConfiguracion]             = useState({});
    const [loading, setLoading]                         = useState(false);
    const [error, setError]                             = useState('');
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
    const [hoverSlot, setHoverSlot]                     = useState(null); // { dia, horaInicio }

    const duracionHoras = duracion / 60;
    const numSlots = Math.max(1, Math.round(duracion / 30)); // cuántas celdas de 30 min abarca el trabajo

    // ── Cálculo de semanas y fechas ──────────────────────────────────────────
    const getFechaInicioSemana = useCallback((offsetSemanas = 0) => {
        const hoy = new Date();
        const diaSemana = hoy.getDay();
        const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - diasHastaLunes);
        lunes.setHours(0, 0, 0, 0);
        const fecha = new Date(lunes.getTime() + offsetSemanas * 7 * 86400000);
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        const d = String(fecha.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const getFechaFinSemana = useCallback((offsetSemanas = 0) => {
        const inicio = new Date(getFechaInicioSemana(offsetSemanas) + 'T00:00:00');
        const fin = new Date(inicio.getTime() + 6 * 86400000);
        const y = fin.getFullYear();
        const m = String(fin.getMonth() + 1).padStart(2, '0');
        const d = String(fin.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [getFechaInicioSemana]);

    const getFechaDiaObj = useCallback((dia, offsetSemanas = semanaActual) => {
        const inicio = new Date(getFechaInicioSemana(offsetSemanas) + 'T00:00:00');
        const idx = DIAS_SEMANA.indexOf(dia);
        const f = new Date(inicio);
        f.setDate(inicio.getDate() + idx);
        return f;
    }, [getFechaInicioSemana, semanaActual]);

    const getFechaDiaISO = useCallback((dia, offsetSemanas = semanaActual) => {
        const f = getFechaDiaObj(dia, offsetSemanas);
        const y = f.getFullYear();
        const m = String(f.getMonth() + 1).padStart(2, '0');
        const d = String(f.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [getFechaDiaObj, semanaActual]);

    const formatearFechaTitulo = (fechaISO) => {
        const f = new Date(fechaISO + 'T00:00:00');
        return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
    };

    const formatearFechaHeader = useCallback((dia) => {
        const f = getFechaDiaObj(dia, semanaActual);
        return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }, [getFechaDiaObj, semanaActual]);

    const esDiaPasado = useCallback((dia) => {
        const f = getFechaDiaObj(dia, semanaActual);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return f < hoy;
    }, [getFechaDiaObj, semanaActual]);

    const esHoy = useCallback((dia) => {
        const f = getFechaDiaObj(dia, semanaActual);
        const hoy = new Date();
        return f.toDateString() === hoy.toDateString();
    }, [getFechaDiaObj, semanaActual]);

    // ── Carga de disponibilidad y configuración ──────────────────────────────
    const cargarHorarios = useCallback(async (offsetSemanas) => {
        try {
            setLoading(true);
            setError('');
            const fechaInicio = getFechaInicioSemana(offsetSemanas);
            let urlDisponibles = `${API_URL}/horarios/profesional/${profesionalId}/disponibles?fechaInicio=${fechaInicio}&duracion=${duracion}`;
            if (ordenId) urlDisponibles += `&ordenId=${ordenId}`;
            const urlConfig = `${API_URL}/horarios/profesional/${profesionalId}/configuracion`;

            const [resDisp, resConf] = await Promise.allSettled([
                fetch(urlDisponibles).then(r => r.json()),
                fetch(urlConfig).then(r => r.json())
            ]);

            if (resDisp.status === 'fulfilled' && resDisp.value.success) {
                setHorariosDisponibles(resDisp.value.data.horariosDisponibles || {});
            } else {
                setError(resDisp.value?.message || 'Error al cargar horarios');
            }

            if (resConf.status === 'fulfilled' && resConf.value.success) {
                setConfiguracion(resConf.value.data || {});
            }
        } catch (err) {
            console.error('Error al cargar horarios:', err);
            setError('Error al cargar los horarios disponibles');
        } finally {
            setLoading(false);
        }
    }, [getFechaInicioSemana, profesionalId, duracion, ordenId]);

    useEffect(() => {
        cargarHorarios(semanaActual);
    }, [semanaActual, cargarHorarios]);

    // ── Navegación ───────────────────────────────────────────────────────────
    const semanaAnterior = () => {
        if (semanaActual > 0) {
            setSemanaActual(s => s - 1);
            setHorarioSeleccionado(null);
            setHoverSlot(null);
        }
    };
    const semanaSiguiente = () => {
        if (semanaActual < 3) {
            setSemanaActual(s => s + 1);
            setHorarioSeleccionado(null);
            setHoverSlot(null);
        }
    };

    // ── Selección ────────────────────────────────────────────────────────────
    const seleccionarSlot = (dia, horaInicioSlot, horaFinSlot) => {
        const fechaISO = getFechaDiaISO(dia, semanaActual);
        setHorarioSeleccionado({
            fecha:      fechaISO,
            dia,
            horaInicio: horaInicioSlot,
            horaFin:    horaFinSlot
        });
    };

    const confirmarSeleccion = () => {
        if (horarioSeleccionado) {
            onHorarioSeleccionado(horarioSeleccionado);
        }
    };

    // ── Evaluación de estado de cada día ─────────────────────────────────────
    const getDiaEstado = useCallback((dia) => {
        if (esDiaPasado(dia)) {
            return { estado: 'pasado', mensaje: 'Día pasado' };
        }

        const configDia = configuracion[dia] || [];
        const diaInfo = horariosDisponibles[dia];
        const slotsDisponibles = diaInfo?.horarios || [];

        let shiftStart = null;
        let shiftEnd   = null;

        if (configDia.length > 0) {
            shiftStart = Math.min(...configDia.map(c => parseTime(c.horaInicio)));
            shiftEnd   = Math.max(...configDia.map(c => parseTime(c.horaFin)));
        } else if (slotsDisponibles.length > 0) {
            shiftStart = parseTime(slotsDisponibles[0].horaInicio);
            shiftEnd   = parseTime(slotsDisponibles[slotsDisponibles.length - 1].horaFin);
        }

        const ventanaAtencion = (shiftStart !== null && shiftEnd !== null) ? (shiftEnd - shiftStart) : 0;

        if (shiftStart === null || ventanaAtencion === 0) {
            return { estado: 'sin_atencion', mensaje: 'Sin horarios', shiftStart: null, shiftEnd: null };
        }

        if (ventanaAtencion < duracionHoras) {
            return {
                estado: 'insuficiente',
                mensaje: 'Tiempo insuficiente',
                shiftStart,
                shiftEnd,
                detalle: `Atiende ${ventanaAtencion} hs (requiere ${duracionHoras} hs)`
            };
        }

        if (slotsDisponibles.length === 0) {
            return {
                estado: 'sin_disponibilidad',
                mensaje: 'Sin disponibilidad',
                shiftStart,
                shiftEnd
            };
        }

        return {
            estado: 'activo',
            shiftStart,
            shiftEnd,
            slotsDisponibles
        };
    }, [esDiaPasado, configuracion, horariosDisponibles, duracionHoras]);

    return (
        <div className="gc-overlay">
            <div className="gc-modal">

                {/* ── Header ── */}
                <div className="gc-header">
                    <h2>{titulo}</h2>
                    <button className="gc-cerrar" onClick={onCerrar} aria-label="Cerrar modal">×</button>
                </div>

                {/* ── Navegación de semana ── */}
                <div className="gc-navegacion">
                    <div className="gc-nav-side">
                        {semanaActual > 0 && (
                            <button className="gc-nav-btn" onClick={semanaAnterior} aria-label="Semana anterior">
                                <FaChevronLeft />
                            </button>
                        )}
                    </div>
                    <div className="gc-semana-info">
                        <span className="gc-semana-titulo">
                            {semanaActual === 0 ? 'Esta semana' :
                             semanaActual === 1 ? 'Próxima semana' :
                             `Semana ${semanaActual + 1}`}
                        </span>
                        <small className="gc-semana-fechas">
                            {formatearFechaTitulo(getFechaInicioSemana(semanaActual))} – {formatearFechaTitulo(getFechaFinSemana(semanaActual))}
                        </small>
                    </div>
                    <div className="gc-nav-side gc-nav-right">
                        {semanaActual < 3 && (
                            <button className="gc-nav-btn" onClick={semanaSiguiente} aria-label="Semana siguiente">
                                <FaChevronRight />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Leyenda y duración ── */}
                <div className="gc-leyenda">
                    <div className="gc-duracion-badge">
                        <FaClock />
                        <span>Duración requerida: <strong>{duracionHoras % 1 === 0 ? duracionHoras : duracionHoras.toFixed(1)} hs</strong> ({numSlots} slots)</span>
                    </div>
                    <div className="gc-leyenda-items">
                        <span className="gc-leyenda-item"><span className="gc-dot gc-dot-disponible" /> Disponible</span>
                        <span className="gc-leyenda-item"><span className="gc-dot gc-dot-fuera" /> Fuera de turno</span>
                        <span className="gc-leyenda-item"><span className="gc-dot gc-dot-seleccionado" /> Seleccionado</span>
                    </div>
                </div>

                {/* ── Loading / Error ── */}
                {loading && (
                    <div className="gc-loading">
                        <div className="gc-spinner" />
                        <p>Cargando disponibilidad semanal...</p>
                    </div>
                )}
                {error && !loading && (
                    <div className="gc-error"><p>{error}</p></div>
                )}

                {/* ── Cuadrícula Semanal (Google Calendar Style) ── */}
                {!loading && !error && (
                    <div className="gc-calendar-wrapper">
                        <div className="gc-calendar-scroll">

                            {/* Cabecera superior fija: 1ª col 'Hora' + 7 cols días */}
                            <div className="gc-header-row">
                                <div className="gc-header-cell gc-header-corner">
                                    <FaClock />
                                    <span>Hora</span>
                                </div>
                                {DIAS_SEMANA.map(dia => {
                                    const diaHoy = esHoy(dia);
                                    const diaPasado = esDiaPasado(dia);
                                    return (
                                        <div
                                            key={dia}
                                            className={`gc-header-cell gc-header-day ${diaHoy ? 'gc-header-hoy' : ''} ${diaPasado ? 'gc-header-pasado' : ''}`}
                                        >
                                            <span className="gc-header-day-nombre">{dia}</span>
                                            <span className="gc-header-day-fecha">{formatearFechaHeader(dia)}</span>
                                            {diaHoy && <span className="gc-pill-hoy">Hoy</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Cuerpo de la grilla: columna de horas + 7 columnas de días */}
                            <div className="gc-body-grid">

                                {/* Columna izquierda: Horas cada 30 min (08:00 a 24:00) */}
                                <div className="gc-time-column">
                                    {HORAS_SLOTS.map((hora) => {
                                        const isHoraEnpunto = hora.endsWith(':00');
                                        return (
                                            <div
                                                key={hora}
                                                className={`gc-time-cell ${isHoraEnpunto ? 'gc-time-enpunto' : 'gc-time-media'}`}
                                                style={{ height: `${SLOT_HEIGHT}px` }}
                                            >
                                                <span>{hora}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="gc-time-cell gc-time-enpunto gc-time-final" style={{ height: '18px' }}>
                                        <span>24:00</span>
                                    </div>
                                </div>

                                {/* 7 Columnas de Días */}
                                {DIAS_SEMANA.map(dia => {
                                    const diaEstado = getDiaEstado(dia);
                                    const esActivo = diaEstado.estado === 'activo';

                                    return (
                                        <div
                                            key={dia}
                                            className={`gc-day-column ${!esActivo ? 'gc-day-disabled' : ''}`}
                                            onMouseLeave={() => setHoverSlot(null)}
                                        >
                                            {/* Render de las 32 celdas de 30 minutos */}
                                            {HORAS_SLOTS.map((timeStr) => {
                                                const timeDec = parseTime(timeStr);

                                                if (!esActivo) {
                                                    return (
                                                        <div
                                                            key={timeStr}
                                                            className="gc-cell gc-cell-inactive-day"
                                                            style={{ height: `${SLOT_HEIGHT}px` }}
                                                        />
                                                    );
                                                }

                                                const fueraDeTurno = timeDec < diaEstado.shiftStart || timeDec >= diaEstado.shiftEnd;
                                                const horarioSlot = !fueraDeTurno ? calcularHorarioSlot(timeStr, diaEstado, duracionHoras) : null;

                                                return (
                                                    <div
                                                        key={timeStr}
                                                        className={`gc-cell ${fueraDeTurno ? 'gc-cell-fuera-turno' : 'gc-cell-disponible'}`}
                                                        style={{ height: `${SLOT_HEIGHT}px` }}
                                                        title={
                                                            fueraDeTurno
                                                                ? 'Fuera de horario laboral'
                                                                : horarioSlot && horarioSlot.horaInicio !== timeStr
                                                                    ? `Ajuste automático al fin de jornada: ${horarioSlot.horaInicio} a ${horarioSlot.horaFin}`
                                                                    : `Iniciar a las ${timeStr} (hasta ${horarioSlot?.horaFin})`
                                                        }
                                                        onClick={() => {
                                                            if (!fueraDeTurno && horarioSlot) {
                                                                seleccionarSlot(dia, horarioSlot.horaInicio, horarioSlot.horaFin);
                                                            }
                                                        }}
                                                        onMouseEnter={() => {
                                                            if (!fueraDeTurno && horarioSlot) {
                                                                setHoverSlot({ dia, horaInicio: horarioSlot.horaInicio, horaFin: horarioSlot.horaFin });
                                                            } else {
                                                                setHoverSlot(null);
                                                            }
                                                        }}
                                                    />
                                                );
                                            })}

                                            {/* Si el día está inactivo (Pasado, Sin atención, Tiempo insuficiente), mostrar badge centrado */}
                                            {!esActivo && (
                                                <div className="gc-day-overlay">
                                                    <div className={`gc-overlay-badge gc-badge-${diaEstado.estado}`}>
                                                        {diaEstado.estado === 'insuficiente' ? (
                                                            <FaExclamationTriangle className="gc-overlay-icon" />
                                                        ) : (
                                                            <FaClock className="gc-overlay-icon" />
                                                        )}
                                                        <span className="gc-overlay-titulo">{diaEstado.mensaje}</span>
                                                        {diaEstado.detalle && (
                                                            <small className="gc-overlay-subtitulo">{diaEstado.detalle}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Preview de hover continuo con autoajuste (caja naranja semi-transparente) */}
                                            {esActivo && hoverSlot?.dia === dia && hoverSlot.horaInicio !== horarioSeleccionado?.horaInicio && (() => {
                                                const hoverIndex = HORAS_SLOTS.indexOf(hoverSlot.horaInicio);
                                                if (hoverIndex === -1) return null;
                                                const hoverTopPx = hoverIndex * SLOT_HEIGHT;
                                                const hoverHeightPx = numSlots * SLOT_HEIGHT;
                                                return (
                                                    <div
                                                        className="gc-preview-block"
                                                        style={{
                                                            top: `${hoverTopPx}px`,
                                                            height: `${hoverHeightPx}px`
                                                        }}
                                                    >
                                                        <span className="gc-preview-text">
                                                            {hoverSlot.horaInicio} – {hoverSlot.horaFin}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Bloque seleccionado continuo (Google Calendar Event Box) */}
                                            {esActivo && horarioSeleccionado?.dia === dia && (() => {
                                                const startIndex = HORAS_SLOTS.indexOf(horarioSeleccionado.horaInicio);
                                                if (startIndex === -1) return null;
                                                const topPx = startIndex * SLOT_HEIGHT;
                                                const heightPx = numSlots * SLOT_HEIGHT;
                                                return (
                                                    <div
                                                        className="gc-selected-block"
                                                        style={{
                                                            top: `${topPx}px`,
                                                            height: `${heightPx}px`
                                                        }}
                                                    >
                                                        <div className="gc-selected-header">
                                                            <FaCheck className="gc-selected-check" />
                                                            <span className="gc-selected-title">Seleccionado</span>
                                                        </div>
                                                        <span className="gc-selected-time">
                                                            {horarioSeleccionado.horaInicio} – {horarioSeleccionado.horaFin}
                                                        </span>
                                                        <span className="gc-selected-duracion">
                                                            {duracionHoras % 1 === 0 ? duracionHoras : duracionHoras.toFixed(1)} hs
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Footer de Confirmación ── */}
                {horarioSeleccionado && (
                    <div className="gc-footer">
                        <div className="gc-seleccion-info">
                            <div className="gc-seleccion-icon-wrapper">
                                <FaCheck />
                            </div>
                            <div className="gc-seleccion-textos">
                                <span className="gc-seleccion-dia">
                                    <strong>{horarioSeleccionado.dia} {formatearFechaHeader(horarioSeleccionado.dia)}</strong>
                                </span>
                                <span className="gc-seleccion-rango">
                                    {horarioSeleccionado.horaInicio} a {horarioSeleccionado.horaFin} ({duracionHoras % 1 === 0 ? duracionHoras : duracionHoras.toFixed(1)} hs continuas)
                                </span>
                            </div>
                        </div>
                        <div className="gc-acciones">
                            <button className="gc-btn-cancelar" onClick={onCerrar}>Cancelar</button>
                            <button className="gc-btn-confirmar" onClick={confirmarSeleccion}>
                                {textoConfirmar}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarioHorarios;
