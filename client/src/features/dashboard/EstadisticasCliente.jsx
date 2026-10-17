import React, { useCallback, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import {
    FaChartBar,
    FaChevronDown,
    FaChevronUp,
    FaClipboardList,
    FaComments,
    FaDollarSign,
    FaEye,
    FaEyeSlash,
    FaInbox,
    FaPercentage,
    FaReceipt,
    FaStar,
    FaTags,
    FaTools
} from 'react-icons/fa';
import perfil from '../../assets/user.png';
import './dashboard.css';

registerLocale('es', es);
setDefaultLocale('es');

const StarsRating = ({ value = 0, size = 'md' }) => {
    const promedio = Number(value) || 0;

    return (
        <div className={`est-stars est-stars-${size}`} aria-label={`${promedio} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const fill = Math.min(1, Math.max(0, promedio - (star - 1))) * 100;

                return (
                    <span key={star} className="est-star">
                        <FaStar className="est-star-empty" />
                        <span className="est-star-fill" style={{ width: `${fill}%` }}>
                            <FaStar />
                        </span>
                    </span>
                );
            })}
        </div>
    );
};

const formatFechaNacimiento = (valor) => {
    if (!valor) {
        return null;
    }

    const match = String(valor).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
};

const PERIODOS = [
    { id: '1m', label: '1M' },
    { id: '3m', label: '3M' },
    { id: '6m', label: '6M' },
    { id: 'custom', label: 'Personalizado' }
];

const formatMoneda = (valor) => {
    if (valor == null || Number.isNaN(Number(valor))) {
        return '—';
    }

    return Number(valor).toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    });
};

const formatPorcentaje = (valor) => {
    if (valor == null || Number.isNaN(Number(valor))) {
        return '—';
    }

    return `${Number(valor).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
};

const buildQueryParams = (periodo, fechaDesde, fechaHasta, tipoProfesionalId) => {
    const params = new URLSearchParams({ periodo });
    if (periodo === 'custom' && fechaDesde && fechaHasta) {
        params.set('desde', format(fechaDesde, 'yyyy-MM-dd'));
        params.set('hasta', format(fechaHasta, 'yyyy-MM-dd'));
    }
    if (tipoProfesionalId) {
        params.set('tipo_profesional_id', String(tipoProfesionalId));
    }
    return params;
};

const PeriodFilter = ({
    periodo,
    fechaDesde,
    fechaHasta,
    onPeriodoChange,
    onFechaDesdeChange,
    onFechaHastaChange,
    idPrefix
}) => (
    <div className="est-filters">
        <div className="est-period-bar" role="tablist" aria-label="Período de análisis">
            {PERIODOS.map((opcion) => (
                <button
                    key={opcion.id}
                    type="button"
                    role="tab"
                    aria-selected={periodo === opcion.id}
                    className={`est-period-btn ${periodo === opcion.id ? 'active' : ''}`}
                    onClick={() => onPeriodoChange(opcion.id)}
                >
                    {opcion.label}
                </button>
            ))}
        </div>

        {periodo === 'custom' && (
            <div className="est-custom-range">
                <div className="filtro-grupo filtro-fecha-rango">
                    <label htmlFor={`${idPrefix}-fecha-desde`}>Desde</label>
                    <DatePicker
                        id={`${idPrefix}-fecha-desde`}
                        selected={fechaDesde}
                        onChange={onFechaDesdeChange}
                        selectsStart
                        startDate={fechaDesde}
                        endDate={fechaHasta}
                        maxDate={fechaHasta || new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Fecha desde"
                        className="date-picker-input"
                        wrapperClassName="date-picker-wrapper"
                        locale="es"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        isClearable
                    />
                </div>
                <div className="filtro-grupo filtro-fecha-rango">
                    <label htmlFor={`${idPrefix}-fecha-hasta`}>Hasta</label>
                    <DatePicker
                        id={`${idPrefix}-fecha-hasta`}
                        selected={fechaHasta}
                        onChange={onFechaHastaChange}
                        selectsEnd
                        startDate={fechaDesde}
                        endDate={fechaHasta}
                        minDate={fechaDesde}
                        maxDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Fecha hasta"
                        className="date-picker-input"
                        wrapperClassName="date-picker-wrapper"
                        locale="es"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        isClearable
                    />
                </div>
            </div>
        )}
    </div>
);

const RUBRO_COLORS = [
    '#ff5a1f',
    '#5ee08a',
    '#4db8ff',
    '#ffe14a',
    '#ff4fd8',
    '#8b7cff',
    '#2ef2c5',
    '#ff6b8a'
];

const PIE_CX = 120;
const PIE_CY = 72;
const PIE_RX = 82;
const PIE_RY = 48;
const PIE_DEPTH = 30;

const puntoElipse = (cx, cy, rx, ry, grados) => {
    const rad = (grados * Math.PI) / 180;
    return {
        x: cx + rx * Math.sin(rad),
        y: cy - ry * Math.cos(rad)
    };
};

const oscurecer = (hex, factor) => {
    const limpio = hex.replace('#', '');
    const canal = (inicio) => Math.max(0, Math.min(255, Math.round(parseInt(limpio.slice(inicio, inicio + 2), 16) * factor)));
    return `rgb(${canal(0)}, ${canal(2)}, ${canal(4)})`;
};

const arcoElipse = (cx, cy, rx, ry, inicio, fin, barrido) => {
    const hasta = puntoElipse(cx, cy, rx, ry, fin);
    const grande = Math.abs(fin - inicio) > 180 ? 1 : 0;
    return `A ${rx} ${ry} 0 ${grande} ${barrido} ${hasta.x} ${hasta.y}`;
};

const caraSuperior = (cx, cy, rx, ry, inicio, fin) => {
    if (fin - inicio >= 359.5) {
        return null;
    }

    const desde = puntoElipse(cx, cy, rx, ry, inicio);
    return `M ${cx} ${cy} L ${desde.x} ${desde.y} ${arcoElipse(cx, cy, rx, ry, inicio, fin, 1)} Z`;
};

const caraLateral = (cx, cy, rx, ry, depth, inicio, fin) => {
    if (fin - inicio < 0.4) {
        return null;
    }

    const desde = puntoElipse(cx, cy, rx, ry, inicio);
    const hasta = puntoElipse(cx, cy, rx, ry, fin);
    const grande = fin - inicio > 180 ? 1 : 0;
    return [
        `M ${desde.x} ${desde.y}`,
        `A ${rx} ${ry} 0 ${grande} 1 ${hasta.x} ${hasta.y}`,
        `L ${hasta.x} ${hasta.y + depth}`,
        `A ${rx} ${ry} 0 ${grande} 0 ${desde.x} ${desde.y + depth}`,
        'Z'
    ].join(' ');
};

const paredRadial = (cx, cy, rx, ry, depth, grados) => {
    const borde = puntoElipse(cx, cy, rx, ry, grados);
    return `M ${cx} ${cy} L ${borde.x} ${borde.y} L ${borde.x} ${borde.y + depth} L ${cx} ${cy + depth} Z`;
};

const SolicitudesPie = ({ rubros = [], seleccionadoId, onSelect }) => {
    const total = rubros.reduce((acc, rubro) => acc + Number(rubro.solicitudes_publicadas || 0), 0);

    if (total === 0) {
        return <p className="est-empty">No hay solicitudes publicadas en este período.</p>;
    }

    let cursor = 0;
    const pedazos = rubros
        .filter((rubro) => Number(rubro.solicitudes_publicadas) > 0)
        .map((rubro, index) => {
            const cantidad = Number(rubro.solicitudes_publicadas) || 0;
            const porcentaje = (cantidad / total) * 100;
            const inicio = cursor;
            const fin = cursor + (porcentaje / 100) * 360;
            cursor = fin;
            const medio = (inicio + fin) / 2;
            const separado = puntoElipse(0, 0, 1, PIE_RY / PIE_RX, medio);
            return {
                ...rubro,
                color: RUBRO_COLORS[index % RUBRO_COLORS.length],
                porcentaje,
                inicio,
                fin,
                medio,
                dx: separado.x,
                dy: separado.y
            };
        });
    const pedazosDibujo = [...pedazos].sort((a, b) => a.dy - b.dy);

    const elegir = (id) => {
        onSelect(seleccionadoId === id ? null : id);
    };

    return (
        <div className="est-solicitudes-pie">
            <svg viewBox="0 0 240 188" role="img" aria-label="Solicitudes publicadas por rubro">
                {pedazosDibujo.map((pedazo) => {
                    const activo = seleccionadoId === pedazo.id;
                    const separacion = pedazos.length === 1 ? 0 : (activo ? 11 : 6);
                    const ox = PIE_CX + pedazo.dx * separacion;
                    const oy = PIE_CY + pedazo.dy * separacion;
                    const lateralInicio = Math.max(pedazo.inicio, 90);
                    const lateralFin = Math.min(pedazo.fin, 270);
                    const lateral = lateralFin > lateralInicio
                        ? caraLateral(ox, oy, PIE_RX, PIE_RY, PIE_DEPTH, lateralInicio, lateralFin)
                        : null;
                    const superior = caraSuperior(ox, oy, PIE_RX, PIE_RY, pedazo.inicio, pedazo.fin);
                    const colorLateral = oscurecer(pedazo.color, 0.58);
                    const colorPared = oscurecer(pedazo.color, 0.74);

                    return (
                        <g
                            key={pedazo.id}
                            onClick={() => elegir(pedazo.id)}
                            opacity={seleccionadoId != null && !activo ? 0.42 : 1}
                        >
                            {lateral && <path d={lateral} fill={colorLateral} />}
                            {pedazo.inicio > 90 && pedazo.inicio < 270 && (
                                <path d={paredRadial(ox, oy, PIE_RX, PIE_RY, PIE_DEPTH, pedazo.inicio)} fill={colorPared} />
                            )}
                            {pedazo.fin > 90 && pedazo.fin < 270 && pedazo.fin - pedazo.inicio < 359.5 && (
                                <path d={paredRadial(ox, oy, PIE_RX, PIE_RY, PIE_DEPTH, pedazo.fin)} fill={colorPared} />
                            )}
                            {superior ? (
                                <path d={superior} fill={pedazo.color} stroke={activo ? '#fff' : 'rgba(0,0,0,0.18)'} strokeWidth={activo ? 1.6 : 0.6} />
                            ) : (
                                <ellipse cx={ox} cy={oy} rx={PIE_RX} ry={PIE_RY} fill={pedazo.color} stroke={activo ? '#fff' : 'rgba(0,0,0,0.18)'} strokeWidth={activo ? 1.6 : 0.6} />
                            )}
                        </g>
                    );
                })}
            </svg>
            <ul className="est-solicitudes-legend">
                {pedazos.map((pedazo) => (
                    <li key={pedazo.id}>
                        <button
                            type="button"
                            className={seleccionadoId === pedazo.id ? 'active' : ''}
                            onClick={() => elegir(pedazo.id)}
                            aria-pressed={seleccionadoId === pedazo.id}
                        >
                            <i style={{ background: pedazo.color }} />
                            <span>
                                {pedazo.nombre}
                                <small>
                                    {pedazo.solicitudes_publicadas} publicadas ({pedazo.porcentaje.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%)
                                    {' · '}
                                    {pedazo.con_aceptado} aceptadas
                                    {' · '}
                                    {pedazo.sin_aceptar} sin aceptar
                                </small>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const GastosChart = ({ intervalos = [], granularidad }) => {
    const maxGastos = Math.max(...intervalos.map((item) => Number(item.gastos) || 0), 0);

    if (intervalos.length === 0) {
        return <p className="est-empty">No hay intervalos para el período seleccionado.</p>;
    }

    return (
        <div className="est-ing-chart" role="img" aria-label="Gastos agrupados por período">
            <ul className="est-ing-hist">
                {intervalos.map((item) => {
                    const gastos = Number(item.gastos) || 0;
                    const cantidad = Number(item.cantidad) || 0;
                    const ancho = maxGastos > 0 ? (gastos / maxGastos) * 100 : 0;

                    return (
                        <li key={item.clave} className="est-ing-hist-row">
                            <span className="est-ing-hist-label">{item.etiqueta}</span>
                            <span className="est-ing-hist-count">
                                <span className="est-ing-hist-count-num">{cantidad}</span>
                                <span>{cantidad === 1 ? 'servicio' : 'servicios'}</span>
                            </span>
                            <div
                                className="est-ing-hist-track"
                                title={`${item.etiqueta}: ${formatMoneda(gastos)} · ${cantidad} servicios`}
                            >
                                <div
                                    className="est-ing-hist-bar"
                                    style={{ width: `${Math.max(ancho, gastos > 0 ? 6 : 0)}%` }}
                                />
                            </div>
                            <span className="est-ing-hist-meta">
                                {formatMoneda(gastos)}
                            </span>
                        </li>
                    );
                })}
            </ul>
            <p className="est-ing-axis-hint">
                Barras horizontales por {granularidad === 'semana' ? 'semana' : 'mes'} según el filtro seleccionado
            </p>
        </div>
    );
};

const EstadisticasCliente = () => {
    const [personaId, setPersonaId] = useState(null);
    const [personaError, setPersonaError] = useState('');
    const [cliente, setCliente] = useState(null);
    const [promedioCliente, setPromedioCliente] = useState(null);
    const [totalCalificaciones, setTotalCalificaciones] = useState(0);
    const [panelVisible, setPanelVisible] = useState(true);
    const [periodo, setPeriodo] = useState('1m');
    const [fechaDesde, setFechaDesde] = useState(null);
    const [fechaHasta, setFechaHasta] = useState(null);
    const [tipoProfesionalId, setTipoProfesionalId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);

    const [panelSolicitudes, setPanelSolicitudes] = useState(true);
    const [periodoSolicitudes, setPeriodoSolicitudes] = useState('1m');
    const [fechaDesdeSolicitudes, setFechaDesdeSolicitudes] = useState(null);
    const [fechaHastaSolicitudes, setFechaHastaSolicitudes] = useState(null);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
    const [errorSolicitudes, setErrorSolicitudes] = useState('');
    const [dataSolicitudes, setDataSolicitudes] = useState(null);
    const [rubroTortaId, setRubroTortaId] = useState(null);

    useEffect(() => {
        const cargarPersona = async () => {
            try {
                const userDataRaw = localStorage.getItem('userData');
                if (!userDataRaw) {
                    setPersonaError('No se encontraron datos de usuario. Iniciá sesión nuevamente.');
                    return;
                }

                const user = JSON.parse(userDataRaw);
                if (!user.id) {
                    setPersonaError('No se encontró el ID del usuario.');
                    return;
                }

                const [personaRes, clienteRes] = await Promise.all([
                    fetch(`http://localhost:3002/api/auth/persona/${user.id}`),
                    fetch(`http://localhost:3002/api/auth/cliente/${user.id}`)
                ]);
                const personaJson = await personaRes.json();
                const clienteJson = await clienteRes.json();
                if (!personaJson?.success || !personaJson.data?.id) {
                    setPersonaError('No se pudo obtener la persona asociada al usuario.');
                    return;
                }

                setPersonaId(personaJson.data.id);
                if (clienteJson?.success) {
                    setCliente(clienteJson.data);
                }
            } catch (err) {
                console.error('Error al obtener la persona del cliente:', err);
                setPersonaError('Error al conectar con el servidor.');
            }
        };

        cargarPersona();
    }, []);

    useEffect(() => {
        if (!personaId) {
            return;
        }

        const cargarCalificacion = async () => {
            try {
                const response = await fetch(`http://localhost:3002/api/calificaciones/persona/${personaId}`);
                const json = await response.json();
                const lista = json?.success && Array.isArray(json.data) ? json.data : [];
                const total = lista.length;
                const suma = lista.reduce((acc, item) => acc + Number(item.puntuacion || 0), 0);

                setTotalCalificaciones(total);
                setPromedioCliente(total > 0 ? Math.round((suma / total) * 10) / 10 : 0);
            } catch (err) {
                console.error('Error al obtener la calificación del cliente:', err);
                setTotalCalificaciones(0);
                setPromedioCliente(0);
            }
        };

        cargarCalificacion();
    }, [personaId]);

    const fetchGastos = useCallback(async () => {
        if (!personaId) {
            return;
        }

        if (periodo === 'custom' && (!fechaDesde || !fechaHasta)) {
            setData(null);
            setError('');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const params = buildQueryParams(periodo, fechaDesde, fechaHasta, tipoProfesionalId);
            const response = await fetch(
                `http://localhost:3002/api/estadisticas/gastos/${personaId}?${params.toString()}`
            );
            const json = await response.json();

            if (!response.ok || !json.success) {
                setError(json.message || 'No se pudieron cargar los gastos.');
                setData(null);
                return;
            }

            setData(json.data);
        } catch (err) {
            console.error('Error al cargar gastos del cliente:', err);
            setError('Error al conectar con el servidor.');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [personaId, periodo, fechaDesde, fechaHasta, tipoProfesionalId]);

    const fetchSolicitudes = useCallback(async () => {
        if (!personaId) {
            return;
        }

        if (periodoSolicitudes === 'custom' && (!fechaDesdeSolicitudes || !fechaHastaSolicitudes)) {
            setDataSolicitudes(null);
            setErrorSolicitudes('');
            setLoadingSolicitudes(false);
            return;
        }

        try {
            setLoadingSolicitudes(true);
            setErrorSolicitudes('');

            const params = buildQueryParams(periodoSolicitudes, fechaDesdeSolicitudes, fechaHastaSolicitudes);
            const response = await fetch(
                `http://localhost:3002/api/estadisticas/solicitudes/${personaId}?${params.toString()}`
            );
            const json = await response.json();

            if (!response.ok || !json.success) {
                setErrorSolicitudes(json.message || 'No se pudieron cargar las solicitudes.');
                setDataSolicitudes(null);
                return;
            }

            setDataSolicitudes(json.data);
        } catch (err) {
            console.error('Error al cargar solicitudes y presupuestos:', err);
            setErrorSolicitudes('Error al conectar con el servidor.');
            setDataSolicitudes(null);
        } finally {
            setLoadingSolicitudes(false);
        }
    }, [personaId, periodoSolicitudes, fechaDesdeSolicitudes, fechaHastaSolicitudes]);

    useEffect(() => {
        fetchGastos();
    }, [fetchGastos]);

    useEffect(() => {
        fetchSolicitudes();
    }, [fetchSolicitudes]);

    useEffect(() => {
        if (rubroTortaId == null || !dataSolicitudes?.rubros) {
            return;
        }

        const sigueDisponible = dataSolicitudes.rubros.some((rubro) => rubro.id === rubroTortaId);
        if (!sigueDisponible) {
            setRubroTortaId(null);
        }
    }, [dataSolicitudes, rubroTortaId]);

    useEffect(() => {
        if (tipoProfesionalId == null || !data?.rubros) {
            return;
        }

        const sigueDisponible = data.rubros.some((rubro) => rubro.id === tipoProfesionalId);
        if (!sigueDisponible) {
            setTipoProfesionalId(null);
        }
    }, [data, tipoProfesionalId]);

    const handlePeriodoChange = (nuevoPeriodo) => {
        setPeriodo(nuevoPeriodo);
        if (nuevoPeriodo !== 'custom') {
            setFechaDesde(null);
            setFechaHasta(null);
        }
    };

    const handlePeriodoSolicitudesChange = (nuevoPeriodo) => {
        setPeriodoSolicitudes(nuevoPeriodo);
        if (nuevoPeriodo !== 'custom') {
            setFechaDesdeSolicitudes(null);
            setFechaHastaSolicitudes(null);
        }
    };

    const kpis = data?.kpis;
    const intervalos = data?.intervalos || [];
    const rubros = data?.rubros || [];
    const rubroActivo = rubros.find((rubro) => rubro.id === tipoProfesionalId) || null;
    const esperandoRango = periodo === 'custom' && (!fechaDesde || !fechaHasta);
    const tituloGrafico = data?.granularidad === 'semana' ? 'Gastos por semana' : 'Gastos por mes';
    const kpisSolicitudes = dataSolicitudes?.kpis;
    const rubrosSolicitudes = dataSolicitudes?.rubros || [];
    const rubroTorta = rubrosSolicitudes.find((rubro) => rubro.id === rubroTortaId) || null;
    const detalleSolicitudes = rubroTorta || kpisSolicitudes;
    const esperandoRangoSolicitudes = periodoSolicitudes === 'custom' && (!fechaDesdeSolicitudes || !fechaHastaSolicitudes);

    return (
        <div className="tab-content estadisticas-profesional">
            {cliente && (
                <section className="est-cliente-card">
                    <img
                        className="est-cliente-foto"
                        src={cliente.foto_perfil
                            ? `http://localhost:3002/uploads/profiles/${cliente.foto_perfil}`
                            : perfil}
                        alt={cliente.nombre_apellido || 'Cliente'}
                    />
                    <div className="est-cliente-datos">
                        <h2>{cliente.nombre_apellido}</h2>
                        <p>{cliente.nombre_usuario} · {cliente.correo}</p>
                        <p>
                            {[cliente.direccion, cliente.localidad_nombre, cliente.provincia_nombre]
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                        {formatFechaNacimiento(cliente.fecha_nacimiento) && (
                            <p>Nacimiento: {formatFechaNacimiento(cliente.fecha_nacimiento)}</p>
                        )}
                    </div>
                    <div className="est-cliente-rating">
                        <strong>
                            {promedioCliente == null
                                ? '—'
                                : promedioCliente.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            <span>/5</span>
                        </strong>
                        <div className="est-cliente-rating-meta">
                            <StarsRating value={promedioCliente ?? 0} size="md" />
                            <p>
                                Calificación promedio
                                {' · '}
                                {totalCalificaciones === 1
                                    ? '1 recibida'
                                    : `${totalCalificaciones} recibidas`}
                            </p>
                        </div>
                    </div>
                </section>
            )}

            <div className="est-header">
                <h2>Estadísticas</h2>
                <p>Mirá cuánto gastaste y si las solicitudes que publicaste están recibiendo ofertas.</p>
            </div>

            {personaError && <div className="est-error">{personaError}</div>}

            <div className="est-panel">
                <button
                    type="button"
                    className="est-toggle-btn"
                    onClick={() => setPanelVisible((visible) => !visible)}
                    aria-expanded={panelVisible}
                >
                    {panelVisible ? <FaEyeSlash /> : <FaEye />}
                    {panelVisible ? 'Ocultar' : 'Mostrar'} gastos del hogar
                    {panelVisible ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {panelVisible && (
                    <div className="est-panel-body">
                        <PeriodFilter
                            idPrefix="est-gastos"
                            periodo={periodo}
                            fechaDesde={fechaDesde}
                            fechaHasta={fechaHasta}
                            onPeriodoChange={handlePeriodoChange}
                            onFechaDesdeChange={setFechaDesde}
                            onFechaHastaChange={setFechaHasta}
                        />

                        {loading && (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                                <p>Cargando gastos...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="est-error">{error}</div>
                        )}

                        {!loading && !error && esperandoRango && (
                            <p className="est-empty">Seleccioná una fecha desde y hasta para ver el análisis.</p>
                        )}

                        {!loading && !error && !esperandoRango && (
                            <>
                                <div className="est-rubro-block">
                                    <span className="est-kpi-label">Filtrar por rubro</span>
                                    {rubros.length === 0 ? (
                                        <p className="est-empty">No hay gastos por rubro en este período.</p>
                                    ) : (
                                        <div className="est-rubro-bar" role="tablist" aria-label="Filtrar por rubro">
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={tipoProfesionalId == null}
                                                className={`est-rubro-btn ${tipoProfesionalId == null ? 'active' : ''}`}
                                                onClick={() => setTipoProfesionalId(null)}
                                            >
                                                <span>Todos</span>
                                                <small>{formatMoneda(rubros.reduce((acc, rubro) => acc + rubro.total, 0))}</small>
                                            </button>
                                            {rubros.map((rubro) => (
                                                <button
                                                    key={rubro.id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={tipoProfesionalId === rubro.id}
                                                    className={`est-rubro-btn ${tipoProfesionalId === rubro.id ? 'active' : ''}`}
                                                    onClick={() => setTipoProfesionalId(rubro.id)}
                                                >
                                                    <span>{rubro.nombre}</span>
                                                    <small>
                                                        {formatMoneda(rubro.total)}
                                                        {' · '}
                                                        {rubro.cantidad} {rubro.cantidad === 1 ? 'servicio' : 'servicios'}
                                                    </small>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="est-kpis">
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon success">
                                            <FaDollarSign />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Total gastado</span>
                                            <strong className="est-kpi-value est-kpi-value-money">
                                                {formatMoneda(kpis?.total_gastado ?? 0)}
                                            </strong>
                                            <span className="est-kpi-hint">
                                                {rubroActivo
                                                    ? `Solo ${rubroActivo.nombre}`
                                                    : 'Servicios terminados en el período'}
                                            </span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon">
                                            <FaTools />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Servicios contratados</span>
                                            <strong className="est-kpi-value">{kpis?.total_servicios ?? 0}</strong>
                                            <span className="est-kpi-hint">
                                                {rubroActivo ? rubroActivo.nombre : 'Todos los rubros'}
                                            </span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon warning">
                                            <FaReceipt />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Ticket promedio</span>
                                            <strong className="est-kpi-value est-kpi-value-money">
                                                {formatMoneda(kpis?.ticket_promedio)}
                                            </strong>
                                            <span className="est-kpi-hint">Total $ / cantidad de servicios</span>
                                        </div>
                                    </article>
                                </div>

                                <div className="est-table-wrap est-ing-visual">
                                    <div className="est-table-title">
                                        {rubroActivo ? <FaTags /> : <FaChartBar />}
                                        <h3>
                                            {rubroActivo ? `${tituloGrafico} · ${rubroActivo.nombre}` : tituloGrafico}
                                        </h3>
                                    </div>
                                    <GastosChart
                                        intervalos={intervalos}
                                        granularidad={data?.granularidad}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="est-panel">
                <button
                    type="button"
                    className="est-toggle-btn"
                    onClick={() => setPanelSolicitudes((visible) => !visible)}
                    aria-expanded={panelSolicitudes}
                >
                    {panelSolicitudes ? <FaEyeSlash /> : <FaEye />}
                    {panelSolicitudes ? 'Ocultar' : 'Mostrar'} solicitudes y presupuestos
                    {panelSolicitudes ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {panelSolicitudes && (
                    <div className="est-panel-body">
                        <PeriodFilter
                            idPrefix="est-solicitudes"
                            periodo={periodoSolicitudes}
                            fechaDesde={fechaDesdeSolicitudes}
                            fechaHasta={fechaHastaSolicitudes}
                            onPeriodoChange={handlePeriodoSolicitudesChange}
                            onFechaDesdeChange={setFechaDesdeSolicitudes}
                            onFechaHastaChange={setFechaHastaSolicitudes}
                        />

                        {loadingSolicitudes && (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                                <p>Cargando solicitudes y presupuestos...</p>
                            </div>
                        )}

                        {!loadingSolicitudes && errorSolicitudes && (
                            <div className="est-error">{errorSolicitudes}</div>
                        )}

                        {!loadingSolicitudes && !errorSolicitudes && esperandoRangoSolicitudes && (
                            <p className="est-empty">Seleccioná una fecha desde y hasta para ver el análisis.</p>
                        )}

                        {!loadingSolicitudes && !errorSolicitudes && !esperandoRangoSolicitudes && (
                            <>
                                <div className="est-table-wrap est-ing-visual">
                                    <div className="est-table-title">
                                        <FaChartBar />
                                        <h3>Solicitudes publicadas por rubro</h3>
                                    </div>
                                    <p className="est-solicitudes-pie-hint">
                                        La torta muestra todas las solicitudes del período.
                                        {rubroTorta
                                            ? ` Viendo ${rubroTorta.nombre}. Hacé clic de nuevo para volver al total.`
                                            : ' Hacé clic en un rubro para ver sus presupuestos, las que no tuvieron oferta y la tasa.'}
                                    </p>
                                    <SolicitudesPie
                                        rubros={rubrosSolicitudes}
                                        seleccionadoId={rubroTortaId}
                                        onSelect={setRubroTortaId}
                                    />
                                </div>

                                <div className="est-kpis">
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon">
                                            <FaClipboardList />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Solicitudes publicadas</span>
                                            <strong className="est-kpi-value">{kpisSolicitudes?.solicitudes_publicadas ?? 0}</strong>
                                            <span className="est-kpi-hint">Todas las solicitudes del período</span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon success">
                                            <FaComments />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Presupuestos recibidos</span>
                                            <strong className="est-kpi-value">{detalleSolicitudes?.presupuestos_recibidos ?? 0}</strong>
                                            <span className="est-kpi-hint">
                                                {rubroTorta ? `Solo ${rubroTorta.nombre}` : 'Ofertas sobre esas solicitudes'}
                                            </span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon warning">
                                            <FaInbox />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Sin ninguna oferta</span>
                                            <strong className="est-kpi-value">{detalleSolicitudes?.sin_oferta ?? 0}</strong>
                                            <span className="est-kpi-hint">
                                                {rubroTorta ? `Solo ${rubroTorta.nombre}` : 'Publicadas y todavía sin presupuesto'}
                                            </span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon">
                                            <FaPercentage />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Tasa de contratación</span>
                                            <strong className="est-kpi-value">{formatPorcentaje(detalleSolicitudes?.tasa_contratacion ?? 0)}</strong>
                                            <span className="est-kpi-hint">
                                                {detalleSolicitudes?.con_aceptado ?? 0} aceptadas de {detalleSolicitudes?.solicitudes_publicadas ?? 0}
                                                {rubroTorta ? ` · ${rubroTorta.nombre}` : ''}
                                            </span>
                                        </div>
                                    </article>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EstadisticasCliente;
