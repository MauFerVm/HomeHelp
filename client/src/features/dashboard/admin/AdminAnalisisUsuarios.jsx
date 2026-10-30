import React, { useEffect, useMemo, useState } from 'react';
import './adminGestion.css';
import { STATIC_URL, API_URL } from '../../../services/apiConfig';

const API = `${API_URL}/admin/analisis-usuarios`;

const PERIODOS = [
    { id: '1a', label: '1 año' },
    { id: '6m', label: '6 meses' },
    { id: '3m', label: '3 meses' }
];

const ROLES = [
    { id: 'todos', label: 'Todos' },
    { id: 'cliente', label: 'Clientes' },
    { id: 'profesional', label: 'Profesionales' }
];

const BarrasHorizontales = ({ puntos }) => {
    if (puntos.length === 0) {
        return <p className="adm-muted">No hay altas en ese período.</p>;
    }

    const maximo = Math.max(...puntos.map((punto) => punto.cantidad), 0);
    const filas = [...puntos].reverse();

    return (
        <div className="adm-hbar">
            {filas.map((punto) => {
                const ancho = maximo > 0 ? (punto.cantidad / maximo) * 100 : 0;
                return (
                    <div key={punto.mes} className="adm-hbar-row">
                        <span className="adm-hbar-label" title={`${punto.nombre} ${punto.anio}`}>
                            {punto.nombre} {punto.anio}
                        </span>
                        <div className="adm-hbar-track">
                            <div className="adm-hbar-fill" style={{ width: `${ancho}%` }} />
                        </div>
                        <strong className="adm-hbar-value">{punto.cantidad}</strong>
                    </div>
                );
            })}
        </div>
    );
};

const AdminAnalisisUsuarios = () => {
    const [categorias, setCategorias] = useState([]);
    const [altas, setAltas] = useState([]);
    const [altasPorTipo, setAltasPorTipo] = useState([]);
    const [ejes, setEjes] = useState({});
    const [periodoId, setPeriodoId] = useState('1a');
    const [rolId, setRolId] = useState('todos');
    const [tipoId, setTipoId] = useState(null);
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
                    throw new Error(json.message || 'No se pudo obtener el análisis');
                }
                if (!cancelado) {
                    setCategorias(json.data.categorias || []);
                    setAltas(json.data.altas || []);
                    setAltasPorTipo(json.data.altasPorTipo || []);
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
    const tipoActivo = rolId === 'profesional'
        ? categorias.find((categoria) => categoria.id === tipoId)
        : null;

    const puntos = useMemo(() => {
        const clientes = new Map();
        const profesionales = new Map();

        altas.forEach((item) => {
            if (item.rol === 'cliente') clientes.set(item.mes, item.cantidad);
            if (item.rol === 'profesional') profesionales.set(item.mes, item.cantidad);
        });

        if (rolId === 'profesional' && tipoId != null) {
            profesionales.clear();
            altasPorTipo.forEach((item) => {
                if (item.tipoId === tipoId) profesionales.set(item.mes, item.cantidad);
            });
        }

        return (eje?.meses || []).map((mes) => {
            const cliente = clientes.get(mes.clave) || 0;
            const profesional = profesionales.get(mes.clave) || 0;
            let cantidad = cliente + profesional;
            if (rolId === 'cliente') cantidad = cliente;
            if (rolId === 'profesional') cantidad = profesional;
            return {
                mes: mes.clave,
                nombre: mes.nombre,
                anio: mes.anio,
                cliente,
                profesional,
                cantidad
            };
        });
    }, [altas, altasPorTipo, eje, rolId, tipoId]);

    const totalVisible = puntos.reduce((total, punto) => total + punto.cantidad, 0);
    const totalClientes = rolId === 'profesional'
        ? 0
        : puntos.reduce((total, punto) => total + punto.cliente, 0);
    const totalProfesionales = rolId === 'cliente'
        ? 0
        : puntos.reduce((total, punto) => total + punto.profesional, 0);
    const etiquetaRol = tipoActivo?.nombre || ROLES.find((rol) => rol.id === rolId)?.label || 'Todos';

    const elegirRol = (rol) => {
        setRolId(rol);
        if (rol !== 'profesional') setTipoId(null);
    };

    if (loading) {
        return (
            <section className="adm-panel">
                <div className="adm-state">
                    <div className="adm-spinner" />
                    <p>Cargando altas...</p>
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
                    <h2>Análisis de usuarios</h2>
                    <p>Altas de cuentas por mes. Arranca en todos los roles y en el último año.</p>
                </div>
            </header>

            <div className="adm-stats adm-stats-3">
                <article className="adm-stat">
                    <span>{etiquetaRol}</span>
                    <strong>{totalVisible}</strong>
                </article>
                <article className="adm-stat">
                    <span>Clientes</span>
                    <strong>{totalClientes}</strong>
                </article>
                <article className="adm-stat">
                    <span>Profesionales</span>
                    <strong>{totalProfesionales}</strong>
                </article>
            </div>

            <div className="adm-analisis-filtros">
                <div className="adm-filters" role="group" aria-label="Período del análisis">
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
                <div className="adm-filters" role="group" aria-label="Rol de las altas">
                    {ROLES.map((rol) => (
                        <button
                            key={rol.id}
                            type="button"
                            className={`adm-chip-btn ${rolId === rol.id ? 'active' : ''}`}
                            onClick={() => elegirRol(rol.id)}
                        >
                            {rol.label}
                        </button>
                    ))}
                </div>
                {rolId === 'profesional' && (
                    <div className="adm-filters" role="group" aria-label="Tipo de profesional">
                        <button
                            type="button"
                            className={`adm-chip-btn ${tipoId == null ? 'active' : ''}`}
                            onClick={() => setTipoId(null)}
                        >
                            Todos los tipos
                        </button>
                        {categorias.map((categoria) => (
                            <button
                                key={categoria.id}
                                type="button"
                                className={`adm-chip-btn ${tipoId === categoria.id ? 'active' : ''}`}
                                onClick={() => setTipoId(categoria.id)}
                            >
                                {categoria.nombre}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <article className="adm-chart-card">
                <div className="adm-chart-head">
                    <h3>Altas por mes</h3>
                </div>
                <BarrasHorizontales puntos={puntos} />
            </article>
        </section>
    );
};

export default AdminAnalisisUsuarios;
