import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { format } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import {
    FaBriefcase,
    FaChartBar,
    FaChartPie,
    FaChartLine,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
    FaCommentAlt,
    FaDollarSign,
    FaEye,
    FaEyeSlash,
    FaLink,
    FaPercentage,
    FaReceipt,
    FaStar,
    FaTrophy,
    FaUnlink
} from 'react-icons/fa';
import './dashboard.css';

registerLocale('es', es);
setDefaultLocale('es');

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

const formatFecha = (valor) => {
    if (!valor) {
        return '—';
    }

    return new Date(valor).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatPorcentaje = (valor) => {
    if (valor == null || Number.isNaN(Number(valor))) {
        return '—';
    }

    const numero = Number(valor);
    const signo = numero > 0 ? '+' : '';
    return `${signo}${numero.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
};

const etiquetaDesvio = (promedio) => {
    if (promedio == null) {
        return 'Sin presupuestos no adjudicados en el período';
    }

    if (promedio > 0) {
        return `En promedio cotizaste un ${Math.abs(promedio).toLocaleString('es-AR', { maximumFractionDigits: 2 })}% más alto`;
    }

    if (promedio < 0) {
        return `En promedio cotizaste un ${Math.abs(promedio).toLocaleString('es-AR', { maximumFractionDigits: 2 })}% más bajo`;
    }

    return 'En promedio cotizaste el mismo monto que el aceptado';
};

const buildQueryParams = (periodo, fechaDesde, fechaHasta) => {
    const params = new URLSearchParams({ periodo });
    if (periodo === 'custom' && fechaDesde && fechaHasta) {
        params.set('desde', format(fechaDesde, 'yyyy-MM-dd'));
        params.set('hasta', format(fechaHasta, 'yyyy-MM-dd'));
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

const IngresosChart = ({ intervalos = [], granularidad }) => {
    const maxIngresos = Math.max(...intervalos.map((item) => Number(item.ingresos) || 0), 0);

    if (intervalos.length === 0) {
        return <p className="est-empty">No hay intervalos para el período seleccionado.</p>;
    }

    return (
        <div className="est-ing-chart" role="img" aria-label="Ingresos agrupados por período">
            <ul className="est-ing-hist">
                {intervalos.map((item) => {
                    const ingresos = Number(item.ingresos) || 0;
                    const cantidad = Number(item.cantidad) || 0;
                    const ancho = maxIngresos > 0 ? (ingresos / maxIngresos) * 100 : 0;

                    return (
                        <li key={item.clave} className="est-ing-hist-row">
                            <span className="est-ing-hist-label">{item.etiqueta}</span>
                            <span className="est-ing-hist-count">
                                <span className="est-ing-hist-count-num">{cantidad}</span>
                                <span>{cantidad === 1 ? 'servicio' : 'servicios'}</span>
                            </span>
                            <div
                                className="est-ing-hist-track"
                                title={`${item.etiqueta}: ${formatMoneda(ingresos)} · ${cantidad} servicios`}
                            >
                                <div
                                    className="est-ing-hist-bar"
                                    style={{ width: `${Math.max(ancho, ingresos > 0 ? 6 : 0)}%` }}
                                />
                            </div>
                            <span className="est-ing-hist-meta">
                                {formatMoneda(ingresos)}
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

const STAR_COLORS = {
    5: '#34a853',
    4: '#7cb342',
    3: '#fbbc04',
    2: '#ff8a00',
    1: '#ea4335'
};

const StarsPieChart = ({ distribucion = [] }) => {
    const total = distribucion.reduce((acc, nivel) => acc + Number(nivel.cantidad || 0), 0);

    if (total === 0) {
        return <p className="est-empty">No hay reseñas para armar el gráfico de torta.</p>;
    }

    let cursor = 0;
    const stops = [];
    const leyenda = [];

    distribucion.forEach((nivel) => {
        const cantidad = Number(nivel.cantidad) || 0;
        if (cantidad === 0) {
            return;
        }

        const porcentaje = (cantidad / total) * 100;
        const siguiente = cursor + porcentaje;
        stops.push(`${STAR_COLORS[nivel.estrellas]} ${cursor}% ${siguiente}%`);
        leyenda.push({
            ...nivel,
            porcentaje
        });
        cursor = siguiente;
    });

    return (
        <div className="est-pie-wrap">
            <div
                className="est-pie"
                style={{ background: `conic-gradient(${stops.join(', ')})` }}
                role="img"
                aria-label="Gráfico de torta de calificaciones por estrellas"
            />
            <ul className="est-pie-legend">
                {leyenda.map((nivel) => (
                    <li key={nivel.estrellas}>
                        <i style={{ background: STAR_COLORS[nivel.estrellas] }} />
                        {nivel.estrellas}★ · {nivel.cantidad} ({nivel.porcentaje.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%)
                    </li>
                ))}
            </ul>
        </div>
    );
};

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

const EstadisticasProfesional = () => {
    const [personaId, setPersonaId] = useState(null);
    const [personaError, setPersonaError] = useState('');

    const [panelIngresos, setPanelIngresos] = useState(true);
    const [periodoIngresos, setPeriodoIngresos] = useState('1m');
    const [fechaDesdeIngresos, setFechaDesdeIngresos] = useState(null);
    const [fechaHastaIngresos, setFechaHastaIngresos] = useState(null);
    const [loadingIngresos, setLoadingIngresos] = useState(false);
    const [errorIngresos, setErrorIngresos] = useState('');
    const [dataIngresos, setDataIngresos] = useState(null);

    const [panelPresupuestos, setPanelPresupuestos] = useState(true);
    const [periodo, setPeriodo] = useState('1m');
    const [fechaDesde, setFechaDesde] = useState(null);
    const [fechaHasta, setFechaHasta] = useState(null);
    const [loadingPresupuestos, setLoadingPresupuestos] = useState(false);
    const [errorPresupuestos, setErrorPresupuestos] = useState('');
    const [dataPresupuestos, setDataPresupuestos] = useState(null);

    const [panelCalificaciones, setPanelCalificaciones] = useState(true);
    const [sincronizarFiltros, setSincronizarFiltros] = useState(true);
    const [periodoCalif, setPeriodoCalif] = useState('1m');
    const [fechaDesdeCalif, setFechaDesdeCalif] = useState(null);
    const [fechaHastaCalif, setFechaHastaCalif] = useState(null);
    const [loadingCalif, setLoadingCalif] = useState(false);
    const [errorCalif, setErrorCalif] = useState('');
    const [dataCalif, setDataCalif] = useState(null);
    const [mostrarTorta, setMostrarTorta] = useState(false);

    const filtrosCalif = useMemo(() => (
        sincronizarFiltros
            ? { periodo, fechaDesde, fechaHasta }
            : { periodo: periodoCalif, fechaDesde: fechaDesdeCalif, fechaHasta: fechaHastaCalif }
    ), [sincronizarFiltros, periodo, fechaDesde, fechaHasta, periodoCalif, fechaDesdeCalif, fechaHastaCalif]);

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

                const personaRes = await fetch(`http://localhost:3002/api/auth/persona/${user.id}`);
                const personaJson = await personaRes.json();
                if (!personaJson?.success || !personaJson.data?.id) {
                    setPersonaError('No se pudo obtener la persona asociada al usuario.');
                    return;
                }

                setPersonaId(personaJson.data.id);
            } catch (err) {
                console.error('Error al obtener la persona del profesional:', err);
                setPersonaError('Error al conectar con el servidor.');
            }
        };

        cargarPersona();
    }, []);

    const fetchIngresos = useCallback(async () => {
        if (!personaId) {
            return;
        }

        if (periodoIngresos === 'custom' && (!fechaDesdeIngresos || !fechaHastaIngresos)) {
            setDataIngresos(null);
            setErrorIngresos('');
            setLoadingIngresos(false);
            return;
        }

        try {
            setLoadingIngresos(true);
            setErrorIngresos('');

            const params = buildQueryParams(periodoIngresos, fechaDesdeIngresos, fechaHastaIngresos);
            const response = await fetch(
                `http://localhost:3002/api/estadisticas/ingresos/${personaId}?${params.toString()}`
            );
            const json = await response.json();

            if (!response.ok || !json.success) {
                setErrorIngresos(json.message || 'No se pudieron cargar los ingresos.');
                setDataIngresos(null);
                return;
            }

            setDataIngresos(json.data);
        } catch (err) {
            console.error('Error al cargar ingresos acumulados:', err);
            setErrorIngresos('Error al conectar con el servidor.');
            setDataIngresos(null);
        } finally {
            setLoadingIngresos(false);
        }
    }, [personaId, periodoIngresos, fechaDesdeIngresos, fechaHastaIngresos]);

    const fetchComparacion = useCallback(async () => {
        if (!personaId) {
            return;
        }

        if (periodo === 'custom' && (!fechaDesde || !fechaHasta)) {
            setDataPresupuestos(null);
            setErrorPresupuestos('');
            setLoadingPresupuestos(false);
            return;
        }

        try {
            setLoadingPresupuestos(true);
            setErrorPresupuestos('');

            const params = buildQueryParams(periodo, fechaDesde, fechaHasta);
            const response = await fetch(
                `http://localhost:3002/api/estadisticas/comparacion-presupuestos/${personaId}?${params.toString()}`
            );
            const json = await response.json();

            if (!response.ok || !json.success) {
                setErrorPresupuestos(json.message || 'No se pudieron cargar las estadísticas.');
                setDataPresupuestos(null);
                return;
            }

            setDataPresupuestos(json.data);
        } catch (err) {
            console.error('Error al cargar comparación de presupuestos:', err);
            setErrorPresupuestos('Error al conectar con el servidor.');
            setDataPresupuestos(null);
        } finally {
            setLoadingPresupuestos(false);
        }
    }, [personaId, periodo, fechaDesde, fechaHasta]);

    const fetchCalificaciones = useCallback(async () => {
        if (!personaId) {
            return;
        }

        if (filtrosCalif.periodo === 'custom' && (!filtrosCalif.fechaDesde || !filtrosCalif.fechaHasta)) {
            setDataCalif(null);
            setErrorCalif('');
            setLoadingCalif(false);
            return;
        }

        try {
            setLoadingCalif(true);
            setErrorCalif('');

            const params = buildQueryParams(
                filtrosCalif.periodo,
                filtrosCalif.fechaDesde,
                filtrosCalif.fechaHasta
            );
            const response = await fetch(
                `http://localhost:3002/api/estadisticas/calificaciones/${personaId}?${params.toString()}`
            );
            const json = await response.json();

            if (!response.ok || !json.success) {
                setErrorCalif(json.message || 'No se pudieron cargar las calificaciones.');
                setDataCalif(null);
                return;
            }

            setDataCalif(json.data);
        } catch (err) {
            console.error('Error al cargar calificaciones y reputación:', err);
            setErrorCalif('Error al conectar con el servidor.');
            setDataCalif(null);
        } finally {
            setLoadingCalif(false);
        }
    }, [personaId, filtrosCalif]);

    useEffect(() => {
        fetchIngresos();
    }, [fetchIngresos]);

    useEffect(() => {
        fetchComparacion();
    }, [fetchComparacion]);

    useEffect(() => {
        fetchCalificaciones();
    }, [fetchCalificaciones]);

    const handlePeriodoIngresosChange = (nuevoPeriodo) => {
        setPeriodoIngresos(nuevoPeriodo);
        if (nuevoPeriodo !== 'custom') {
            setFechaDesdeIngresos(null);
            setFechaHastaIngresos(null);
        }
    };

    const handlePeriodoChange = (nuevoPeriodo) => {
        setPeriodo(nuevoPeriodo);
        if (nuevoPeriodo !== 'custom') {
            setFechaDesde(null);
            setFechaHasta(null);
        }
    };

    const handlePeriodoCalifChange = (nuevoPeriodo) => {
        setPeriodoCalif(nuevoPeriodo);
        if (nuevoPeriodo !== 'custom') {
            setFechaDesdeCalif(null);
            setFechaHastaCalif(null);
        }
    };

    const handleToggleSincronizar = () => {
        setSincronizarFiltros((actual) => {
            const siguiente = !actual;
            if (!siguiente) {
                setPeriodoCalif(periodo);
                setFechaDesdeCalif(fechaDesde);
                setFechaHastaCalif(fechaHasta);
            }
            return siguiente;
        });
    };

    const kpisIngresos = dataIngresos?.kpis;
    const intervalosIngresos = dataIngresos?.intervalos || [];
    const kpis = dataPresupuestos?.kpis;
    const items = dataPresupuestos?.items || [];
    const esperandoRangoIngresos = periodoIngresos === 'custom' && (!fechaDesdeIngresos || !fechaHastaIngresos);
    const esperandoRangoPresupuestos = periodo === 'custom' && (!fechaDesde || !fechaHasta);
    const esperandoRangoCalif = filtrosCalif.periodo === 'custom' && (!filtrosCalif.fechaDesde || !filtrosCalif.fechaHasta);

    return (
        <div className="tab-content estadisticas-profesional">
            <div className="est-header">
                <h2>Estadísticas de Mis Servicios</h2>
                <p>Analizá tus ingresos cobrados, el rendimiento de tus presupuestos y tu reputación.</p>
            </div>

            {personaError && <div className="est-error">{personaError}</div>}

            <div className="est-panel">
                <button
                    type="button"
                    className="est-toggle-btn"
                    onClick={() => setPanelIngresos((visible) => !visible)}
                    aria-expanded={panelIngresos}
                >
                    {panelIngresos ? <FaEyeSlash /> : <FaEye />}
                    {panelIngresos ? 'Ocultar' : 'Mostrar'} ingresos acumulados
                    {panelIngresos ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {panelIngresos && (
                    <div className="est-panel-body">
                        <PeriodFilter
                            idPrefix="est-ing"
                            periodo={periodoIngresos}
                            fechaDesde={fechaDesdeIngresos}
                            fechaHasta={fechaHastaIngresos}
                            onPeriodoChange={handlePeriodoIngresosChange}
                            onFechaDesdeChange={setFechaDesdeIngresos}
                            onFechaHastaChange={setFechaHastaIngresos}
                        />

                        {loadingIngresos && (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                                <p>Cargando ingresos acumulados...</p>
                            </div>
                        )}

                        {!loadingIngresos && errorIngresos && (
                            <div className="est-error">{errorIngresos}</div>
                        )}

                        {!loadingIngresos && !errorIngresos && esperandoRangoIngresos && (
                            <p className="est-empty">Seleccioná una fecha desde y hasta para ver el análisis.</p>
                        )}

                        {!loadingIngresos && !errorIngresos && !esperandoRangoIngresos && (
                            <>
                                <div className="est-kpis">
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon success">
                                            <FaDollarSign />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Total recaudado</span>
                                            <strong className="est-kpi-value est-kpi-value-money">
                                                {formatMoneda(kpisIngresos?.total_recaudado ?? 0)}
                                            </strong>
                                            <span className="est-kpi-hint">Servicios cobrados en el período</span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon">
                                            <FaBriefcase />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Servicios completados</span>
                                            <strong className="est-kpi-value">{kpisIngresos?.total_servicios ?? 0}</strong>
                                            <span className="est-kpi-hint">Órdenes finalizadas y cobradas</span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon warning">
                                            <FaReceipt />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Ticket promedio</span>
                                            <strong className="est-kpi-value est-kpi-value-money">
                                                {formatMoneda(kpisIngresos?.ticket_promedio)}
                                            </strong>
                                            <span className="est-kpi-hint">Total $ / cantidad de servicios</span>
                                        </div>
                                    </article>
                                </div>

                                <div className="est-table-wrap est-ing-visual">
                                    <div className="est-table-title">
                                        <FaChartBar />
                                        <h3>
                                            {dataIngresos?.granularidad === 'semana'
                                                ? 'Ingresos por semana'
                                                : 'Ingresos por mes'}
                                        </h3>
                                    </div>
                                    <IngresosChart
                                        intervalos={intervalosIngresos}
                                        granularidad={dataIngresos?.granularidad}
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
                    onClick={() => setPanelPresupuestos((visible) => !visible)}
                    aria-expanded={panelPresupuestos}
                >
                    {panelPresupuestos ? <FaEyeSlash /> : <FaEye />}
                    {panelPresupuestos ? 'Ocultar' : 'Mostrar'} comparación de presupuestos
                    {panelPresupuestos ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {panelPresupuestos && (
                    <div className="est-panel-body">
                        <PeriodFilter
                            idPrefix="est-presu"
                            periodo={periodo}
                            fechaDesde={fechaDesde}
                            fechaHasta={fechaHasta}
                            onPeriodoChange={handlePeriodoChange}
                            onFechaDesdeChange={setFechaDesde}
                            onFechaHastaChange={setFechaHasta}
                        />

                        {loadingPresupuestos && (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                                <p>Cargando comparación de presupuestos...</p>
                            </div>
                        )}

                        {!loadingPresupuestos && errorPresupuestos && (
                            <div className="est-error">{errorPresupuestos}</div>
                        )}

                        {!loadingPresupuestos && !errorPresupuestos && esperandoRangoPresupuestos && (
                            <p className="est-empty">Seleccioná una fecha desde y hasta para ver el análisis.</p>
                        )}

                        {!loadingPresupuestos && !errorPresupuestos && !esperandoRangoPresupuestos && (
                            <>
                                <div className="est-kpis">
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon">
                                            <FaChartBar />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Presupuestos enviados</span>
                                            <strong className="est-kpi-value">{kpis?.total_enviados ?? 0}</strong>
                                            <span className="est-kpi-hint">En el período seleccionado</span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon success">
                                            <FaTrophy />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Tasa de conversión</span>
                                            <strong className="est-kpi-value">{formatPorcentaje(kpis?.tasa_conversion ?? 0)}</strong>
                                            <span className="est-kpi-hint">
                                                {kpis?.total_ganados ?? 0} aceptados de {kpis?.total_enviados ?? 0}
                                            </span>
                                        </div>
                                    </article>
                                    <article className="est-kpi-card">
                                        <div className="est-kpi-icon warning">
                                            <FaPercentage />
                                        </div>
                                        <div className="est-kpi-body">
                                            <span className="est-kpi-label">Desvío promedio</span>
                                            <strong className="est-kpi-value">{formatPorcentaje(kpis?.promedio_desvio)}</strong>
                                            <span className="est-kpi-hint">{etiquetaDesvio(kpis?.promedio_desvio)}</span>
                                        </div>
                                    </article>
                                </div>

                                <div className="est-table-wrap">
                                    <div className="est-table-title">
                                        <FaChartLine />
                                        <h3>Detalle por solicitud</h3>
                                    </div>

                                    {items.length === 0 ? (
                                        <p className="est-empty">No enviaste presupuestos en este período.</p>
                                    ) : (
                                        <table className="est-table">
                                            <thead>
                                                <tr>
                                                    <th>Solicitud</th>
                                                    <th>Fecha de envío</th>
                                                    <th>Mi presupuesto</th>
                                                    <th>Presupuesto aceptado</th>
                                                    <th>Variación</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item) => (
                                                    <tr key={item.presupuesto_id}>
                                                        <td data-label="Solicitud">
                                                            <span className="est-solicitud-title">{item.solicitud_titulo}</span>
                                                        </td>
                                                        <td data-label="Fecha de envío">{formatFecha(item.fecha_envio)}</td>
                                                        <td data-label="Mi presupuesto">{formatMoneda(item.monto_propio)}</td>
                                                        <td data-label="Presupuesto aceptado">{formatMoneda(item.monto_aceptado)}</td>
                                                        <td data-label="Variación">
                                                            <span className={`est-variacion est-variacion-${item.variacion_sentido}`}>
                                                                {item.variacion_etiqueta}
                                                            </span>
                                                        </td>
                                                        <td data-label="Estado">
                                                            <span className={`est-estado est-estado-${item.caso}`}>
                                                                {item.caso === 'ganado' && <FaCheckCircle />}
                                                                {item.estado}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="est-panel est-panel-reputacion">
                <button
                    type="button"
                    className="est-toggle-btn"
                    onClick={() => setPanelCalificaciones((visible) => !visible)}
                    aria-expanded={panelCalificaciones}
                >
                    {panelCalificaciones ? <FaEyeSlash /> : <FaEye />}
                    {panelCalificaciones ? 'Ocultar' : 'Mostrar'} calificaciones y reputación
                    {panelCalificaciones ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {panelCalificaciones && (
                    <div className="est-panel-body">
                        <div className="est-sync-row">
                            <button
                                type="button"
                                className={`est-sync-btn ${sincronizarFiltros ? 'active' : ''}`}
                                onClick={handleToggleSincronizar}
                            >
                                {sincronizarFiltros ? <FaLink /> : <FaUnlink />}
                                {sincronizarFiltros
                                    ? 'Usando los mismos filtros que presupuestos'
                                    : 'Filtros independientes'}
                            </button>
                            <span className="est-sync-hint">
                                {sincronizarFiltros
                                    ? 'Los cambios de 1M / 3M / 6M / Personalizado de arriba también aplican acá.'
                                    : 'Elegí un período propio para esta tarjeta.'}
                            </span>
                        </div>

                        {!sincronizarFiltros && (
                            <PeriodFilter
                                idPrefix="est-calif"
                                periodo={periodoCalif}
                                fechaDesde={fechaDesdeCalif}
                                fechaHasta={fechaHastaCalif}
                                onPeriodoChange={handlePeriodoCalifChange}
                                onFechaDesdeChange={setFechaDesdeCalif}
                                onFechaHastaChange={setFechaHastaCalif}
                            />
                        )}

                        {loadingCalif && (
                            <div className="loading-container">
                                <div className="loading-spinner" />
                                <p>Cargando calificaciones y reputación...</p>
                            </div>
                        )}

                        {!loadingCalif && errorCalif && (
                            <div className="est-error">{errorCalif}</div>
                        )}

                        {!loadingCalif && !errorCalif && esperandoRangoCalif && (
                            <p className="est-empty">Seleccioná una fecha desde y hasta para ver el análisis.</p>
                        )}

                        {!loadingCalif && !errorCalif && !esperandoRangoCalif && (
                            <>
                                <div className="est-rep-grid">
                                    <article className="est-rep-summary">
                                        <span className="est-kpi-label">Promedio general</span>
                                        <strong className="est-rep-score">
                                            {(dataCalif?.promedio ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                            <span> / 5</span>
                                        </strong>
                                        <StarsRating value={dataCalif?.promedio ?? 0} size="lg" />
                                        <p className="est-rep-total">
                                            {dataCalif?.total_resenas ?? 0} {(dataCalif?.total_resenas ?? 0) === 1 ? 'reseña' : 'reseñas'} en el período
                                        </p>
                                    </article>

                                    <article className="est-rep-histogram">
                                        <div className="est-hist-header">
                                            <span className="est-kpi-label">Distribución de estrellas</span>
                                            <button
                                                type="button"
                                                className={`est-pie-toggle ${mostrarTorta ? 'active' : ''}`}
                                                onClick={() => setMostrarTorta((visible) => !visible)}
                                            >
                                                <FaChartPie />
                                                {mostrarTorta ? 'Ocultar gráfico de torta' : 'Ver gráfico de torta'}
                                            </button>
                                        </div>
                                        <div className={`est-dist-split ${mostrarTorta ? 'with-pie' : ''}`}>
                                            <ul className="est-hist-list">
                                                {(dataCalif?.distribucion || []).map((nivel) => (
                                                    <li key={nivel.estrellas} className="est-hist-row">
                                                        <span className="est-hist-label">{nivel.estrellas}★</span>
                                                        <div
                                                            className="est-hist-track"
                                                            role="img"
                                                            aria-label={`${nivel.estrellas} estrellas: ${nivel.cantidad} reseñas, ${nivel.porcentaje}%`}
                                                        >
                                                            <div
                                                                className={`est-hist-bar est-hist-bar-${nivel.estrellas}`}
                                                                style={{ width: `${nivel.porcentaje}%` }}
                                                            />
                                                        </div>
                                                        <span className="est-hist-meta">
                                                            {nivel.porcentaje.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
                                                            <small>({nivel.cantidad})</small>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {mostrarTorta && (
                                                <StarsPieChart distribucion={dataCalif?.distribucion || []} />
                                            )}
                                        </div>
                                    </article>
                                </div>

                                <div className="est-table-wrap">
                                    <div className="est-table-title">
                                        <FaCommentAlt />
                                        <h3>Últimas calificaciones recibidas</h3>
                                    </div>

                                    {(dataCalif?.ultimas || []).length === 0 ? (
                                        <p className="est-empty">No recibiste calificaciones en este período.</p>
                                    ) : (
                                        <ul className="est-reviews-list">
                                            {dataCalif.ultimas.map((resena) => (
                                                <li key={resena.id} className="est-review-item">
                                                    <div className="est-review-head">
                                                        <StarsRating value={resena.puntuacion} size="sm" />
                                                        <span className="est-review-score">{resena.puntuacion}/5</span>
                                                        <span className="est-review-date">{formatFecha(resena.fecha)}</span>
                                                    </div>
                                                    {resena.solicitud_titulo && (
                                                        <p className="est-review-meta">
                                                            <span className="est-review-label">Título del problema</span>
                                                            {resena.solicitud_titulo}
                                                        </p>
                                                    )}
                                                    {resena.comentario ? (
                                                        <p className="est-review-comment">
                                                            <span className="est-review-label">Comentario del cliente</span>
                                                            “{resena.comentario}”
                                                        </p>
                                                    ) : (
                                                        <p className="est-review-comment est-review-comment-empty">
                                                            <span className="est-review-label">Comentario del cliente</span>
                                                            Sin comentario
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EstadisticasProfesional;
