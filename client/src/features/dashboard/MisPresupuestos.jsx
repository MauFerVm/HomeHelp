import React, { useEffect, useState } from 'react';
import './dashboard.css';
import { FaClock, FaExclamationTriangle, FaCheckCircle, FaEye } from 'react-icons/fa';
import { minutosToHHMM } from '../../utils/timeUtils';

const MisPresupuestos = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [solicitudesConPresupuestos, setSolicitudesConPresupuestos] = useState([]);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

    const getPrioridadColor = (prioridad) => {
        switch (prioridad) {
            case 'alta':
                return '#ff4444';
            case 'media':
                return '#ffaa00';
            case 'baja':
                return '#44ff44';
            default:
                return '#666';
        }
    };

    const getPrioridadIcon = (prioridad) => {
        switch (prioridad) {
            case 'alta':
                return <FaExclamationTriangle />;
            case 'media':
                return <FaClock />;
            case 'baja':
                return <FaCheckCircle />;
            default:
                return <FaClock />;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const userDataRaw = localStorage.getItem('userData');
                if (!userDataRaw) {
                    setError('No se encontraron datos de usuario. Inicie sesión nuevamente.');
                    setLoading(false);
                    return;
                }
                const user = JSON.parse(userDataRaw);
                if (!user.id) {
                    setError('No se encontró el ID del usuario.');
                    setLoading(false);
                    return;
                }

                // Obtener persona_id del cliente a partir de usuario.id
                const personaRes = await fetch(`http://localhost:3002/api/auth/persona/${user.id}`);
                const personaJson = await personaRes.json();
                if (!personaJson || personaJson.success === false || !personaJson.data?.id) {
                    setError('No se pudo obtener la persona asociada al usuario.');
                    setLoading(false);
                    return;
                }
                const clientePersonaId = personaJson.data.id;

                // Traer solicitudes del cliente
                const solRes = await fetch(`http://localhost:3002/api/solicitudes/cliente/${clientePersonaId}`);
                const solJson = await solRes.json();
                const solicitudes = Array.isArray(solJson?.data) ? solJson.data : [];

                // Para cada solicitud, traer sus presupuestos
                const solicitudesAgrupadas = await Promise.all(
                    solicitudes.map(async (sol) => {
                        const presuRes = await fetch(`http://localhost:3002/api/presupuestos/solicitud/${sol.id}`);
                        const presuJson = await presuRes.json();
                        const presupuestos = Array.isArray(presuJson?.data) ? presuJson.data : [];
                        return { solicitud: sol, presupuestos };
                    })
                );

                setSolicitudesConPresupuestos(solicitudesAgrupadas);
            } catch (e) {
                console.error('Error al cargar presupuestos:', e);
                setError('Ocurrió un error al cargar los presupuestos.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>Mis presupuestos</h2>
                <p>Los presupuestos para tus solicitudes</p>
            </div>
            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p>Cargando presupuestos...</p>
                </div>
            )}
            {!loading && error && (
                <div className="error-message" style={{ marginTop: 12 }}>{error}</div>
            )}
            {!loading && !error && (
                <div className="presupuestos-wrapper">
                    {solicitudesConPresupuestos.length === 0 ? (
                        <p>No tienes solicitudes creadas aún.</p>
                    ) : (
                        solicitudesConPresupuestos.map(({ solicitud, presupuestos }) => (
                            <div key={solicitud.id} className="presupuesto-group">
                                <div className="presupuesto-group-header">
                                    <div>
                                        <h3 className="presupuesto-solicitud-title">{solicitud.titulo}</h3>
                                        {solicitud.descripcion && (
                                            <p className="presupuesto-solicitud-desc">{solicitud.descripcion}</p>
                                        )}
                                    </div>
                                    <div className="presupuesto-solicitud-meta">
                                        <span>Solicitud #{solicitud.id}</span>
                                        <span className="solicitud-prioridad-badge" style={{ color: getPrioridadColor(solicitud.prioridad) }}>
                                            {getPrioridadIcon(solicitud.prioridad)}
                                            <span className="prioridad-text">{solicitud.prioridad.toUpperCase()}</span>
                                        </span>
                                        <span>{new Date(solicitud.creado_en).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="presupuesto-group-body">
                                    {presupuestos.length === 0 ? (
                                        <div className="presupuesto-empty">
                                            esta solicitud todavia no recibio ningun presupuesto
                                        </div>
                                    ) : (
                                        <ul className="presupuesto-list presupuesto-grid-2">
                                            {presupuestos.map(p => (
                                                <li key={p.id} className="presupuesto-item presupuesto-card">
                                                    <div className="presupuesto-card-header">
                                                        <div className="presupuesto-pro-info">
                                                            {p.profesional_foto ? (
                                                                <img
                                                                    src={`http://localhost:3002/uploads/profiles/${p.profesional_foto}`}
                                                                    alt={p.profesional_nombre || 'Profesional'}
                                                                    className="presupuesto-pro-avatar"
                                                                />
                                                            ) : (
                                                                <div className="presupuesto-pro-avatar placeholder" />
                                                            )}
                                                            <div>
                                                                <div className="presupuesto-pro-name">{p.profesional_nombre || 'Profesional'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="presupuesto-date">
                                                            {new Date(p.creado_en).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="presupuesto-card-actions">
                                                        <button className="ver-detalle-button" onClick={() => { setPresupuestoSeleccionado(p); setDetalleAbierto(true); }}>
                                                            <FaEye />
                                                            Ver Detalles
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            {detalleAbierto && presupuestoSeleccionado && (
                <div className="modal-overlay" onClick={() => { setDetalleAbierto(false); setPresupuestoSeleccionado(null); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalles del Presupuesto</h2>
                            <button className="close-button" onClick={() => { setDetalleAbierto(false); setPresupuestoSeleccionado(null); }}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detalle-section">
                                <h3>Profesional</h3>
                                <div className="presupuesto-pro-info" style={{ marginTop: 8 }}>
                                    {presupuestoSeleccionado.profesional_foto ? (
                                        <img
                                            src={`http://localhost:3002/uploads/profiles/${presupuestoSeleccionado.profesional_foto}`}
                                            alt={presupuestoSeleccionado.profesional_nombre || 'Profesional'}
                                            className="presupuesto-pro-avatar"
                                        />
                                    ) : (
                                        <div className="presupuesto-pro-avatar placeholder" />
                                    )}
                                    <div>
                                        <div className="presupuesto-pro-name">{presupuestoSeleccionado.profesional_nombre || 'Profesional'}</div>
                                        {presupuestoSeleccionado.tipo_profesional && (
                                            <div className="presupuesto-pro-role">{presupuestoSeleccionado.tipo_profesional}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="detalle-section">
                                <h4>Monto</h4>
                                <div className="presupuesto-amount">${Number(presupuestoSeleccionado.monto).toFixed(2)}</div>
                            </div>
                            {presupuestoSeleccionado.duracion && (
                                <div className="detalle-section">
                                    <h4>Duración Aproximada</h4>
                                    <div className="presupuesto-duracion">
                                        <FaClock style={{ marginRight: '8px', color: '#FF6B35' }} />
                                        {minutosToHHMM(presupuestoSeleccionado.duracion)}
                                    </div>
                                </div>
                            )}
                            {presupuestoSeleccionado.descripcion && (
                                <div className="detalle-section">
                                    <h4>Descripción</h4>
                                    <div className="presupuesto-desc">{presupuestoSeleccionado.descripcion}</div>
                                </div>
                            )}
                            <div className="detalle-section">
                                <h4>Estado</h4>
                                <div className={`presupuesto-status ${presupuestoSeleccionado.estado}`}>Estado: {presupuestoSeleccionado.estado}</div>
                            </div>
                            <div className="detalle-section">
                                <h4>Enviado</h4>
                                <div className="presupuesto-date">{new Date(presupuestoSeleccionado.creado_en).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-button" onClick={() => { setDetalleAbierto(false); setPresupuestoSeleccionado(null); }}>Cerrar</button>
                            <button className="aplicar-button" onClick={() => { /* TODO: Implementar aceptar presupuesto */ }}>
                                Aceptar Presupuesto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MisPresupuestos;


