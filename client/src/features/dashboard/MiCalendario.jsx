import React, { useState, useEffect, useMemo } from 'react';
import {
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaSpinner,
    FaArrowLeft
} from 'react-icons/fa';
import './MiCalendario.css';

const DIAS_SEMANA_CORTO = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getFechaInicioSemana = (offsetSemanas = 0) => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diasHastaLunes);
    lunesActual.setHours(0, 0, 0, 0);
    const fechaInicio = new Date(lunesActual.getTime() + (offsetSemanas * 7 * 24 * 60 * 60 * 1000));
    return fechaInicio.toISOString().split('T')[0];
};

const getFechaFinSemana = (offsetSemanas = 0) => {
    const fechaInicio = new Date(getFechaInicioSemana(offsetSemanas));
    const fechaFin = new Date(fechaInicio.getTime() + (6 * 24 * 60 * 60 * 1000));
    return fechaFin.toISOString().split('T')[0];
};

const toDateKey = (fecha) => {
    if (!fecha) return null;
    if (typeof fecha === 'string') return fecha.substring(0, 10);
    const d = new Date(fecha);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const dateKeyFromParts = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const key = toDateKey(fecha);
    return new Date(key + 'T00:00:00').toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5);
};

const parseHoraMinutos = (hora) => {
    if (!hora) return null;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
};

const generarSlotsHorarios = (horariosDia) => {
    const slots = [];
    
    if (!horariosDia || horariosDia.length === 0) {
        // Fallback to default hours if no schedule is defined
        for (let h = 8; h < 20; h++) {
            slots.push({
                horaInicio: `${String(h).padStart(2, '0')}:00`,
                horaFin: `${String(h + 1).padStart(2, '0')}:00`,
                label: `${h} a ${h + 1}`,
                horaInicioMin: h * 60,
                horaFinMin: (h + 1) * 60
            });
        }
        return slots;
    }
    
    // Generate slots based on the professional's schedule for the day
    horariosDia.forEach(horario => {
        const inicioMin = parseHoraMinutos(horario.horaInicio);
        const finMin = parseHoraMinutos(horario.horaFin);
        
        // Generate hourly slots within the schedule range
        for (let minutos = inicioMin; minutos < finMin; minutos += 60) {
            const h = Math.floor(minutos / 60);
            const hFin = Math.floor((minutos + 60) / 60);
            slots.push({
                horaInicio: `${String(h).padStart(2, '0')}:00`,
                horaFin: `${String(hFin).padStart(2, '0')}:00`,
                label: `${h} a ${hFin}`,
                horaInicioMin: minutos,
                horaFinMin: minutos + 60
            });
        }
    });
    
    return slots;
};

const getOrdenRangoMin = (orden) => {
    const inicio = parseHoraMinutos(orden.horarioInicio);
    if (inicio === null) return null;
    const fin = parseHoraMinutos(orden.horaFin);
    return {
        inicio,
        fin: fin !== null && fin > inicio ? fin : inicio + 60
    };
};

const getOrdenSlotIndices = (orden, slotsHorarios) => {
    const rango = getOrdenRangoMin(orden);
    if (!rango) return null;

    let startIndex = -1;
    let endIndex = -1;

    slotsHorarios.forEach((slot, i) => {
        if (rango.inicio < slot.horaFinMin && rango.fin > slot.horaInicioMin) {
            if (startIndex === -1) startIndex = i;
            endIndex = i;
        }
    });

    if (startIndex === -1) return null;

    return {
        startIndex,
        rowSpan: endIndex - startIndex + 1
    };
};

const construirGrillaMes = (year, month) => {
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    let paddingInicio = primerDia.getDay();
    paddingInicio = paddingInicio === 0 ? 6 : paddingInicio - 1;

    const celdas = [];

    for (let i = paddingInicio - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        celdas.push({
            date: d,
            day: d.getDate(),
            isCurrentMonth: false,
            dateKey: toDateKey(d)
        });
    }

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
        const date = new Date(year, month, d);
        celdas.push({
            date,
            day: d,
            isCurrentMonth: true,
            dateKey: dateKeyFromParts(year, month, d)
        });
    }

    let trailing = 1;
    while (celdas.length % 7 !== 0) {
        const nextDate = new Date(year, month + 1, trailing);
        celdas.push({
            date: nextDate,
            day: nextDate.getDate(),
            isCurrentMonth: false,
            dateKey: toDateKey(nextDate)
        });
        trailing++;
    }

    return celdas;
};

const MiCalendario = () => {
    const hoyKey = toDateKey(new Date());
    const rangoInicio = getFechaInicioSemana(0);
    const rangoFin = getFechaFinSemana(3);

    const [mesOffset, setMesOffset] = useState(0);
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [personaId, setPersonaId] = useState(null);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
    const [configuracionHorarios, setConfiguracionHorarios] = useState(null);

    const mesVisible = useMemo(() => {
        const base = new Date();
        return new Date(base.getFullYear(), base.getMonth() + mesOffset, 1);
    }, [mesOffset]);

    const year = mesVisible.getFullYear();
    const month = mesVisible.getMonth();

    const celdasMes = useMemo(() => construirGrillaMes(year, month), [year, month]);

    const mesMinOffset = useMemo(() => {
        const base = new Date();
        const inicio = new Date(rangoInicio + 'T00:00:00');
        return (inicio.getFullYear() - base.getFullYear()) * 12 + (inicio.getMonth() - base.getMonth());
    }, [rangoInicio]);

    const mesMaxOffset = useMemo(() => {
        const base = new Date();
        const fin = new Date(rangoFin + 'T00:00:00');
        return (fin.getFullYear() - base.getFullYear()) * 12 + (fin.getMonth() - base.getMonth());
    }, [rangoFin]);

    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (!storedUserData) return;

        try {
            const userData = JSON.parse(storedUserData);
            if (!userData?.id) return;

            const fetchPersonaId = async () => {
                try {
                    const response = await fetch(`http://localhost:3002/api/auth/persona/${userData.id}`);
                    const data = await response.json();
                    if (data.success && data.data) {
                        setPersonaId(data.data.id);
                    }
                } catch (err) {
                    console.error('Error al obtener persona_id:', err);
                    setError('Error al obtener datos del profesional');
                }
            };

            fetchPersonaId();
        } catch (err) {
            console.error('Error al parsear userData:', err);
        }
    }, []);

    useEffect(() => {
        if (!personaId) return;

        const fetchOrdenes = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch(
                    `http://localhost:3002/api/ordenes/profesional/${personaId}?fechaInicio=${rangoInicio}&fechaFin=${rangoFin}`
                );
                const data = await response.json();

                if (data.success) {
                    setOrdenes(data.data.filter((orden) => orden.estado !== 'cancelado'));
                } else {
                    setError(data.message || 'Error al cargar las órdenes de trabajo');
                }
            } catch (err) {
                console.error('Error al cargar órdenes:', err);
                setError('Error al cargar las órdenes de trabajo');
            } finally {
                setLoading(false);
            }
        };

        const fetchConfiguracionHorarios = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3002/api/horarios/profesional/${personaId}/configuracion`
                );
                const data = await response.json();

                if (data.success) {
                    setConfiguracionHorarios(data.data);
                }
            } catch (err) {
                console.error('Error al cargar configuración de horarios:', err);
            }
        };

        fetchOrdenes();
        fetchConfiguracionHorarios();
    }, [personaId, rangoInicio, rangoFin]);

    const ordenesPorFecha = useMemo(() => {
        const mapa = {};
        ordenes.forEach((orden) => {
            const key = toDateKey(orden.fecha_programada);
            if (!key) return;
            if (!mapa[key]) mapa[key] = [];
            mapa[key].push(orden);
        });
        Object.keys(mapa).forEach((key) => {
            mapa[key].sort((a, b) => {
                const ha = a.horarioInicio || '';
                const hb = b.horarioInicio || '';
                return ha.localeCompare(hb);
            });
        });
        return mapa;
    }, [ordenes]);

    const estaEnRango = (dateKey) => dateKey >= rangoInicio && dateKey <= rangoFin;

    const esHoy = (dateKey) => dateKey === hoyKey;

    const esFinDeSemana = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const mesAnterior = () => {
        if (mesOffset > mesMinOffset) setMesOffset(mesOffset - 1);
    };

    const mesSiguiente = () => {
        if (mesOffset < mesMaxOffset) setMesOffset(mesOffset + 1);
    };

    const abrirDia = (dateKey) => {
        if (!estaEnRango(dateKey)) return;
        setDiaSeleccionado(dateKey);
        setOrdenSeleccionada(null);
    };

    const cerrarDia = () => {
        setDiaSeleccionado(null);
        setOrdenSeleccionada(null);
    };

    const ordenesDelDiaSeleccionado = diaSeleccionado ? (ordenesPorFecha[diaSeleccionado] || []) : [];

    // Get the day of the week for the selected date
    const diaSemanaSeleccionado = useMemo(() => {
        if (!diaSeleccionado) return null;
        const fecha = new Date(diaSeleccionado + 'T00:00:00');
        const diaNumero = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        const diaIndex = diaNumero === 0 ? 6 : diaNumero - 1; // Convert to 0=Lunes, ..., 6=Domingo
        return DIAS_SEMANA_COMPLETO[diaIndex];
    }, [diaSeleccionado]);

    // Generate slots based on the selected day's schedule
    const slotsHorariosDia = useMemo(() => {
        if (!diaSemanaSeleccionado || !configuracionHorarios) {
            return generarSlotsHorarios(null); // Fallback to default
        }
        const horariosDelDia = configuracionHorarios[diaSemanaSeleccionado] || [];
        return generarSlotsHorarios(horariosDelDia);
    }, [diaSemanaSeleccionado, configuracionHorarios]);

    const totalOrdenes = ordenes.length;

    return (
        <div className="mi-calendario tab-content">
            <h2>Mi Calendario</h2>
            <p className="mi-calendario-subtitle">
                Próximas 3 semanas
                {totalOrdenes > 0 && ` · ${totalOrdenes} trabajo${totalOrdenes !== 1 ? 's' : ''} programado${totalOrdenes !== 1 ? 's' : ''}`}
            </p>

            <div className="mi-calendario-container">
                {!diaSeleccionado && (
                    <>
                        <div className="mi-calendario-mes-header">
                            <div className="mes-nav">
                                {mesOffset > mesMinOffset && (
                                    <button type="button" className="nav-button" onClick={mesAnterior} aria-label="Mes anterior">
                                        <FaChevronLeft />
                                    </button>
                                )}
                            </div>
                            <div className="mes-titulo">
                                <span className="mes-nombre">{MESES[month]}</span>
                                <span className="mes-anio">{year}</span>
                            </div>
                            <div className="mes-nav mes-nav-right">
                                {mesOffset < mesMaxOffset && (
                                    <button type="button" className="nav-button" onClick={mesSiguiente} aria-label="Mes siguiente">
                                        <FaChevronRight />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mi-calendario-dias-header">
                            {DIAS_SEMANA_CORTO.map((dia, i) => (
                                <span key={`${dia}-${i}`} className={`dia-header-label ${i >= 5 ? 'fin-de-semana' : ''}`}>
                                    {dia}
                                </span>
                            ))}
                        </div>

                        {loading && (
                            <div className="mi-calendario-loading">
                                <FaSpinner className="spin-icon" />
                                <p>Cargando órdenes de trabajo...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mi-calendario-error">
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !error && (
                            <div className="mi-calendario-mes-grid">
                                {celdasMes.map((celda, index) => {
                                    const tieneOrdenes = (ordenesPorFecha[celda.dateKey]?.length || 0) > 0;
                                    const enRango = estaEnRango(celda.dateKey);
                                    const hoy = esHoy(celda.dateKey);
                                    const finDeSemana = esFinDeSemana(celda.date);

                                    return (
                                        <button
                                            key={`${celda.dateKey}-${index}`}
                                            type="button"
                                            className={[
                                                'mi-calendario-celda',
                                                !celda.isCurrentMonth && 'otro-mes',
                                                !enRango && 'fuera-rango',
                                                hoy && 'hoy',
                                                tieneOrdenes && 'con-ordenes',
                                                finDeSemana && 'fin-de-semana'
                                            ].filter(Boolean).join(' ')}
                                            onClick={() => abrirDia(celda.dateKey)}
                                            disabled={!enRango}
                                        >
                                            <span className="celda-numero">{celda.day}</span>
                                            {tieneOrdenes && enRango && (
                                                <span className="marca-orden" aria-hidden="true" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mi-calendario-leyenda">
                            <span className="leyenda-item">
                                <span className="marca-orden leyenda-dot" />
                                Día con órdenes de trabajo
                            </span>
                        </div>
                    </>
                )}

                {diaSeleccionado && (
                    <div className="mi-calendario-dia-vista">
                        <div className="dia-vista-header">
                            <button type="button" className="volver-button" onClick={cerrarDia}>
                                <FaArrowLeft />
                                <span>Calendario</span>
                            </button>
                            <div className="dia-vista-titulo">
                                <FaCalendarAlt />
                                <h3>{formatFecha(diaSeleccionado)}</h3>
                            </div>
                            <span className="dia-vista-count">
                                {ordenesDelDiaSeleccionado.length} orden{ordenesDelDiaSeleccionado.length !== 1 ? 'es' : ''}
                            </span>
                        </div>

                        <div className="agenda-horarios">
                            {slotsHorariosDia.map((slot, index) => (
                                <div
                                    key={`hora-${slot.horaInicio}`}
                                    className="agenda-hora"
                                    style={{ gridRow: index + 1, gridColumn: 1 }}
                                >
                                    <span className="agenda-hora-label">{slot.label}</span>
                                </div>
                            ))}
                            {slotsHorariosDia.map((slot, index) => (
                                <div
                                    key={`slot-${slot.horaInicio}`}
                                    className="agenda-slot-bg"
                                    style={{ gridRow: index + 1, gridColumn: 2 }}
                                />
                            ))}
                            {ordenesDelDiaSeleccionado.map((orden) => {
                                const slots = getOrdenSlotIndices(orden, slotsHorariosDia);
                                if (!slots) return null;

                                return (
                                    <button
                                        key={orden.id}
                                        type="button"
                                        className="agenda-orden-card"
                                        style={{
                                            gridRow: `${slots.startIndex + 1} / span ${slots.rowSpan}`,
                                            gridColumn: 2
                                        }}
                                        onClick={() => setOrdenSeleccionada(orden)}
                                    >
                                        <span className="agenda-orden-titulo">
                                            {orden.solicitud_titulo}
                                        </span>
                                        <span className="agenda-orden-hora">
                                            <FaClock />
                                            {formatHora(orden.horarioInicio)}
                                            {orden.horaFin ? ` - ${formatHora(orden.horaFin)}` : ''}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {ordenSeleccionada && (
                <div className="mi-calendario-modal-overlay" onClick={() => setOrdenSeleccionada(null)}>
                    <div className="mi-calendario-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mi-calendario-modal-header">
                            <h3>{ordenSeleccionada.solicitud_titulo}</h3>
                            <button type="button" className="cerrar-modal" onClick={() => setOrdenSeleccionada(null)}>
                                ×
                            </button>
                        </div>

                        <div className="mi-calendario-modal-body">
                            <div className="detalle-item">
                                <h4>Descripción</h4>
                                <p>{ordenSeleccionada.descripcion || 'Sin descripción'}</p>
                            </div>

                            <div className="detalle-item">
                                <h4>
                                    <FaMapMarkerAlt className="detalle-icon" />
                                    Dirección
                                </h4>
                                <p>{ordenSeleccionada.direccion || 'Sin dirección'}</p>
                            </div>

                            <div className="detalle-item">
                                <h4>
                                    <FaCalendarAlt className="detalle-icon" />
                                    Fecha
                                </h4>
                                <p>{formatFecha(ordenSeleccionada.fecha_programada)}</p>
                            </div>

                            <div className="detalle-item">
                                <h4>
                                    <FaClock className="detalle-icon" />
                                    Hora
                                </h4>
                                <p>
                                    {formatHora(ordenSeleccionada.horarioInicio)}
                                    {ordenSeleccionada.horaFin ? ` - ${formatHora(ordenSeleccionada.horaFin)}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiCalendario;
