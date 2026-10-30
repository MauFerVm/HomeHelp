import React, { useEffect, useMemo, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './adminGestion.css';
import { STATIC_URL, API_URL } from '../../../services/apiConfig';

const API = `${API_URL}/admin/reporte-ingresos`;

const PERIODOS = [
    { id: '1a', label: '1 año' },
    { id: '6m', label: '6 meses' },
    { id: '3m', label: '3 meses' }
];

const etiquetaMes = (punto) => `${punto.nombre || punto.mes} ${punto.anio || ''}`.trim();

const formatMoneda = (valor) => Number(valor || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
});

const EjeMeses = ({ eje }) => {
    if (!eje || eje.columnas === 0) return null;

    return (
        <div className="adm-axis" style={{ '--cols': eje.columnas }}>
            <div className="adm-axis-row">
                {eje.mesesAnioPasado > 0 && (
                    <span className="adm-axis-year" style={{ '--span': eje.mesesAnioPasado }}>
                        {eje.anioPasado}
                    </span>
                )}
                {eje.mesesEsteAnio > 0 && (
                    <span className="adm-axis-year" style={{ '--span': eje.mesesEsteAnio }}>
                        {eje.anioActual}
                    </span>
                )}
            </div>
            <div className="adm-axis-row">
                {eje.meses.map((mes) => (
                    <span key={mes.clave} className="adm-axis-month">
                        <span className="adm-mes-largo">{mes.nombre}</span>
                        <span className="adm-mes-corto">{mes.nombre.slice(0, 3)}</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

const LineaMensual = ({ puntos, eje, rubro }) => {
    const [seleccionado, setSeleccionado] = useState(null);

    useEffect(() => {
        setSeleccionado(null);
    }, [puntos]);

    if (puntos.length === 0) {
        return <p className="adm-muted">No hay órdenes cerradas en ese rubro.</p>;
    }

    const ancho = 720;
    const alto = 220;
    const margen = { arriba: 22, abajo: 16 };
    const innerAlto = alto - margen.arriba - margen.abajo;
    const maximo = Math.max(...puntos.map((punto) => punto.monto), 0);

    const coordenadas = puntos.map((punto, indice) => {
        const x = ((indice + 0.5) / puntos.length) * ancho;
        const y = margen.arriba + innerAlto - (maximo === 0 ? 0 : (punto.monto / maximo) * innerAlto);
        return { ...punto, x, y };
    });

    const recorrido = coordenadas.map((punto) => `${punto.x},${punto.y}`).join(' ');
    const cartel = coordenadas.find((punto) => punto.mes === seleccionado);
    const cartelArriba = cartel ? cartel.y > alto * 0.42 : true;
    const cartelLado = !cartel
        ? 'centro'
        : cartel.x < ancho * 0.2
            ? 'izquierda'
            : cartel.x > ancho * 0.8
                ? 'derecha'
                : 'centro';

    return (
        <div className="adm-line-wrap">
            <div className="adm-line-stage">
            <svg className="adm-line" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Monto de órdenes cerradas por mes">
                <polyline className="adm-line-path" points={recorrido} />
                {coordenadas.map((punto) => (
                    <g key={punto.mes}>
                        <circle
                            className={`adm-line-dot ${seleccionado === punto.mes ? 'activo' : ''}`}
                            cx={punto.x}
                            cy={punto.y}
                            r={seleccionado === punto.mes ? 6 : 4.5}
                        />
                        <circle
                            className="adm-line-hit"
                            cx={punto.x}
                            cy={punto.y}
                            r="14"
                            onClick={() => setSeleccionado((actual) => (actual === punto.mes ? null : punto.mes))}
                        >
                            <title>{etiquetaMes(punto)}</title>
                        </circle>
                    </g>
                ))}
            </svg>
            {cartel && (
                <aside
                    className={`adm-point-card ${cartelArriba ? 'arriba' : 'abajo'} ${cartelLado}`}
                    style={{
                        left: `${(cartel.x / ancho) * 100}%`,
                        top: `${(cartel.y / alto) * 100}%`
                    }}
                >
                    <p>{etiquetaMes(cartel)}</p>
                    <strong>{formatMoneda(cartel.monto)}</strong>
                    <span>
                        {cartel.cantidad === 1 ? '1 orden cerrada' : `${cartel.cantidad} órdenes cerradas`}
                        {' · '}
                        {rubro}
                    </span>
                </aside>
            )}
            </div>
            <EjeMeses eje={eje} />
        </div>
    );
};

const AdminReportesIngresos = () => {
    const [categorias, setCategorias] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [ejes, setEjes] = useState({});
    const [categoriaId, setCategoriaId] = useState(null);
    const [periodoId, setPeriodoId] = useState('1a');
    const [graficoVisible, setGraficoVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelado = false;

        const cargar = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await fetch(API);
                const json = await response.json();
                if (!response.ok || !json.success) {
                    throw new Error(json.message || 'No se pudo obtener el reporte');
                }
                if (!cancelado) {
                    setCategorias(json.data.categorias || []);
                    setMovimientos(json.data.movimientos || []);
                    setEjes(json.data.ejes || {});
                }
            } catch (err) {
                if (!cancelado) setError(err.message || 'Error de conexión');
            } finally {
                if (!cancelado) setLoading(false);
            }
        };

        cargar();
        return () => {
            cancelado = true;
        };
    }, []);

    const eje = ejes[periodoId] || ejes['1a'] || null;

    const filtrados = useMemo(() => {
        const claves = new Set((eje?.meses || []).map((mes) => mes.clave));
        return movimientos.filter((item) => {
            if (claves.size > 0 && !claves.has(item.mes)) return false;
            return categoriaId == null || item.categoriaId === categoriaId;
        });
    }, [movimientos, categoriaId, eje]);

    const puntos = useMemo(() => {
        const porMes = new Map();
        filtrados.forEach((item) => {
            const actual = porMes.get(item.mes) || { monto: 0, cantidad: 0 };
            porMes.set(item.mes, {
                monto: actual.monto + item.monto,
                cantidad: actual.cantidad + item.cantidad
            });
        });

        return (eje?.meses || []).map((mes) => ({
            mes: mes.clave,
            nombre: mes.nombre,
            anio: mes.anio,
            monto: porMes.get(mes.clave)?.monto || 0,
            cantidad: porMes.get(mes.clave)?.cantidad || 0
        }));
    }, [filtrados, eje]);

    const totalMonto = puntos.reduce((total, item) => total + item.monto, 0);
    const totalOrdenes = puntos.reduce((total, item) => total + item.cantidad, 0);
    const rubroActivo = categorias.find((categoria) => categoria.id === categoriaId);

    if (loading) {
        return (
            <section className="adm-panel">
                <div className="adm-state">
                    <div className="adm-spinner" />
                    <p>Cargando ingresos...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="adm-panel">
                <div className="adm-state">
                    <p>{error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="adm-panel">
            <header className="adm-header">
                <div>
                    <h2>Reportes de ingresos</h2>
                    <p>Monto de las órdenes cerradas por mes. Arranca en el último año y el rubro recorta esa serie.</p>
                </div>
            </header>

            <div className="adm-stats adm-stats-3">
                <article className="adm-stat">
                    <span>Ingresos</span>
                    <strong>{formatMoneda(totalMonto)}</strong>
                </article>
                <article className="adm-stat">
                    <span>Órdenes cerradas</span>
                    <strong>{totalOrdenes}</strong>
                </article>
                <article className="adm-stat">
                    <span>Rubro</span>
                    <strong className="adm-stat-text">{rubroActivo ? rubroActivo.nombre : 'Todos'}</strong>
                </article>
            </div>

            <div className="adm-toolbar">
                <div className="adm-filters" role="group" aria-label="Período del reporte">
                    {PERIODOS.map((periodo) => (
                        <button
                            key={periodo.id}
                            type="button"
                            className={`adm-chip-btn ${periodoId === periodo.id ? 'active' : ''}`}
                            onClick={() => setPeriodoId(periodo.id)}
                        >
                            {periodo.label}
                        </button>
                    ))}
                </div>
                <div className="adm-filters" role="group" aria-label="Filtrar ingresos por categoría">
                    <button
                        type="button"
                        className={`adm-chip-btn ${categoriaId == null ? 'active' : ''}`}
                        onClick={() => setCategoriaId(null)}
                    >
                        Todas
                    </button>
                    {categorias.map((categoria) => (
                        <button
                            key={categoria.id}
                            type="button"
                            className={`adm-chip-btn ${categoriaId === categoria.id ? 'active' : ''}`}
                            onClick={() => setCategoriaId(categoria.id)}
                        >
                            {categoria.nombre}
                        </button>
                    ))}
                </div>
            </div>

            <article className="adm-chart-card">
                <div className="adm-chart-head">
                    <h3>Monto por mes</h3>
                    <button
                        type="button"
                        className="adm-hide-btn"
                        onClick={() => setGraficoVisible((visible) => !visible)}
                        aria-expanded={graficoVisible}
                    >
                        {graficoVisible ? <FaEyeSlash /> : <FaEye />}
                        {graficoVisible ? 'Ocultar' : 'Mostrar'}
                    </button>
                </div>
                {graficoVisible && (
                    <LineaMensual
                        puntos={puntos}
                        eje={eje}
                        rubro={rubroActivo ? rubroActivo.nombre : 'Todos los rubros'}
                    />
                )}
            </article>
        </section>
    );
};

export default AdminReportesIngresos;
