import React, { useEffect, useState } from 'react';
import './adminGestion.css';
import { STATIC_URL, API_URL } from '../../../services/apiConfig';

const API = `${API_URL}/admin/estadisticas-generales`;

const COLORES = ['#a74924', '#2a9d8f', '#c9a227', '#3dbe7a', '#5b8def', '#d64545', '#c77dff'];

const Barras = ({ items, unidad }) => {
    const maximo = Math.max(...items.map((item) => item.cantidad), 0);

    if (items.length === 0) {
        return <p className="adm-muted">No hay datos para este gráfico.</p>;
    }

    return (
        <ul className="adm-bars">
            {items.map((item) => {
                const ancho = maximo > 0 ? (item.cantidad / maximo) * 100 : 0;
                return (
                    <li key={item.nombre}>
                        <span className="adm-bars-label" title={item.nombre}>{item.nombre}</span>
                        <div className="adm-bars-track" title={`${item.nombre}: ${item.cantidad}`}>
                            <div
                                className="adm-bars-fill"
                                style={{ width: `${item.cantidad > 0 ? Math.max(ancho, 4) : 0}%` }}
                            />
                        </div>
                        <strong>{item.cantidad}</strong>
                    </li>
                );
            })}
            <li className="adm-bars-hint">{unidad}</li>
        </ul>
    );
};

const Dona = ({ items }) => {
    const total = items.reduce((acumulado, item) => acumulado + item.cantidad, 0);

    if (items.length === 0) {
        return <p className="adm-muted">No hay estados de solicitud cargados.</p>;
    }

    let cursor = 0;
    const estados = items.map((item, indice) => {
        const color = COLORES[indice % COLORES.length];
        const porcentaje = total > 0 ? (item.cantidad / total) * 100 : 0;
        let tramo = null;

        if (item.cantidad > 0) {
            const siguiente = cursor + porcentaje;
            tramo = `${color} ${cursor}% ${siguiente}%`;
            cursor = siguiente;
        }

        return { ...item, porcentaje, color, tramo };
    });
    const cortes = estados.filter((item) => item.tramo).map((item) => item.tramo);

    return (
        <div className="adm-donut-wrap">
            <div
                className="adm-donut"
                style={cortes.length > 0 ? { background: `conic-gradient(${cortes.join(', ')})` } : undefined}
                role="img"
                aria-label="Solicitudes por estado, en el orden del ciclo"
            >
                <span>{total}</span>
            </div>
            <ul className="adm-donut-legend">
                {estados.map((item) => (
                    <li key={item.nombre}>
                        <i style={{ background: item.color }} />
                        <span>{item.etiqueta}</span>
                        <strong>
                            {item.cantidad}
                            {total > 0 ? ` (${item.porcentaje.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%)` : ''}
                        </strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AdminEstadisticasGenerales = () => {
    const [data, setData] = useState(null);
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
                    throw new Error(json.message || 'No se pudieron obtener las estadísticas');
                }
                if (!cancelado) setData(json.data);
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

    if (loading) {
        return (
            <section className="adm-panel">
                <div className="adm-state">
                    <div className="adm-spinner" />
                    <p>Cargando estadísticas...</p>
                </div>
            </section>
        );
    }

    if (error || !data) {
        return (
            <section className="adm-panel">
                <div className="adm-state">
                    <p>{error || 'No se pudieron obtener las estadísticas'}</p>
                </div>
            </section>
        );
    }

    const stats = [
        { label: 'Solicitudes', valor: data.totales.solicitudes },
        { label: 'Profesionales', valor: data.totales.profesionales },
        { label: 'Rubros activos', valor: data.totales.rubros }
    ];

    return (
        <section className="adm-panel">
            <header className="adm-header">
                <div>
                    <h2>Estadísticas generales</h2>
                    <p>Solicitudes por categoría y por estado, y profesionales registrados en cada rubro.</p>
                </div>
            </header>

            <div className="adm-stats adm-stats-3">
                {stats.map((stat) => (
                    <article key={stat.label} className="adm-stat">
                        <span>{stat.label}</span>
                        <strong>{stat.valor}</strong>
                    </article>
                ))}
            </div>

            <div className="adm-charts">
                <article className="adm-chart-card">
                    <h3>Solicitudes por categoría</h3>
                    <Barras items={data.solicitudesPorCategoria} unidad="Cantidad de solicitudes publicadas" />
                </article>
                <article className="adm-chart-card">
                    <h3>Solicitudes por estado</h3>
                    <Dona items={data.solicitudesPorEstado} />
                </article>
                <article className="adm-chart-card adm-chart-wide">
                    <h3>Profesionales por rubro</h3>
                    <Barras items={data.profesionalesPorRubro} unidad="Profesionales distintos asignados a cada rubro" />
                </article>
            </div>
        </section>
    );
};

export default AdminEstadisticasGenerales;
