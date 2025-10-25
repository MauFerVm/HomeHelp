import React, { useEffect, useState } from 'react';
import './dashboard.css';
import { FaClock, FaExclamationTriangle, FaCheckCircle, FaEye, FaFilter } from 'react-icons/fa';
import { minutosToHHMM } from '../../utils/timeUtils';
import CalendarioHorarios from '../../components/CalendarioHorarios';

const MisPresupuestos = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [solicitudesConPresupuestos, setSolicitudesConPresupuestos] = useState([]);
    const [solicitudesFiltradas, setSolicitudesFiltradas] = useState([]);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
    const [calendarioAbierto, setCalendarioAbierto] = useState(false);
    const [confirmandoHorario, setConfirmandoHorario] = useState(false);
    const [filtros, setFiltros] = useState({
        prioridad: '',
        dias: ''
    });
    const [showFiltros, setShowFiltros] = useState(false);
    const [prioridadesDisponibles, setPrioridadesDisponibles] = useState([]);

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

    // Cargar prioridades disponibles desde la base de datos
    useEffect(() => {
        const fetchPrioridadesDisponibles = async () => {
            try {
                const response = await fetch('http://localhost:3002/api/solicitudes/prioridades');
                const data = await response.json();
                
                if (data.success) {
                    setPrioridadesDisponibles(data.data);
                } else {
                    console.error('Error al obtener prioridades:', data.message);
                }
            } catch (error) {
                console.error('Error al cargar prioridades:', error);
            }
        };

        fetchPrioridadesDisponibles();
    }, []);

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

    // Aplicar filtros cuando cambien los filtros o las solicitudes
    useEffect(() => {
        let resultado = [...solicitudesConPresupuestos];

        // Filtro por prioridad
        if (filtros.prioridad) {
            resultado = resultado.filter(item => 
                item.solicitud.prioridad === filtros.prioridad
            );
        }

        // Filtro por fecha (últimos X días)
        if (filtros.dias) {
            const diasAtras = parseInt(filtros.dias);
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
            
            resultado = resultado.filter(item => 
                new Date(item.solicitud.creado_en) >= fechaLimite
            );
        }

        setSolicitudesFiltradas(resultado);
    }, [filtros, solicitudesConPresupuestos]);

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            prioridad: '',
            dias: ''
        });
    };

    // Función para abrir el calendario
    const abrirCalendario = () => {
        setCalendarioAbierto(true);
    };

    // Función para cerrar el calendario
    const cerrarCalendario = () => {
        setCalendarioAbierto(false);
    };

    // Función para manejar la selección de horario
    const manejarSeleccionHorario = async (horarioSeleccionado) => {
        try {
            setConfirmandoHorario(true);
            
            const response = await fetch(
                `http://localhost:3002/api/horarios/presupuesto/${presupuestoSeleccionado.id}/confirmar`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fecha: horarioSeleccionado.fecha,
                        horaInicio: horarioSeleccionado.horaInicio,
                        horaFin: horarioSeleccionado.horaFin
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                // Actualizar el estado del presupuesto en la lista local
                setSolicitudesConPresupuestos(prev => 
                    prev.map(item => ({
                        ...item,
                        presupuestos: item.presupuestos.map(p => 
                            p.id === presupuestoSeleccionado.id 
                                ? { ...p, estado: 'aceptado' }
                                : p
                        )
                    }))
                );

                // Cerrar modales
                setCalendarioAbierto(false);
                setDetalleAbierto(false);
                setPresupuestoSeleccionado(null);

                // Mostrar mensaje de éxito
                alert('¡Horario confirmado exitosamente! Se ha creado la orden de trabajo y el profesional ha sido notificado.');
            } else {
                alert('Error al confirmar el horario: ' + (data.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error al confirmar horario:', error);
            alert('Error al confirmar el horario. Por favor, inténtalo nuevamente.');
        } finally {
            setConfirmandoHorario(false);
        }
    };

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
                <>
                    {/* Filtros */}
                    <div className="filtros-container">
                        <button 
                            className="toggle-filtros-btn"
                            onClick={() => setShowFiltros(!showFiltros)}
                        >
                            <FaFilter />
                            {showFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                        </button>

                        {showFiltros && (
                            <div className="filtros-content">
                                <div className="filtro-grupo">
                                    <label htmlFor="filtro-prioridad">Prioridad:</label>
                                    <select
                                        id="filtro-prioridad"
                                        value={filtros.prioridad}
                                        onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {prioridadesDisponibles.map((prioridad) => (
                                            <option key={prioridad} value={prioridad}>
                                                {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filtro-grupo">
                                    <label htmlFor="filtro-dias">Fecha:</label>
                                    <select
                                        id="filtro-dias"
                                        value={filtros.dias}
                                        onChange={(e) => handleFiltroChange('dias', e.target.value)}
                                    >
                                        <option value="">Todas las fechas</option>
                                        <option value="5">Últimos 5 días</option>
                                        <option value="10">Últimos 10 días</option>
                                        <option value="20">Últimos 20 días</option>
                                    </select>
                                </div>

                                <button 
                                    className="limpiar-filtros-btn"
                                    onClick={limpiarFiltros}
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="presupuestos-wrapper">
                        {solicitudesFiltradas.length === 0 ? (
                            <p>
                                {solicitudesConPresupuestos.length === 0 
                                    ? 'No tienes solicitudes creadas aún.' 
                                    : 'No hay solicitudes que coincidan con los filtros seleccionados.'}
                            </p>
                        ) : (
                            solicitudesFiltradas.map(({ solicitud, presupuestos }) => (
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
                </>
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
                            {presupuestoSeleccionado.estado === 'enviado' ? (
                                <button 
                                    className="aplicar-button" 
                                    onClick={abrirCalendario}
                                    disabled={confirmandoHorario}
                                >
                                    {confirmandoHorario ? 'Procesando...' : 'Aceptar Presupuesto'}
                                </button>
                            ) : (
                                <button className="aplicar-button" disabled>
                                    {presupuestoSeleccionado.estado === 'aceptado' ? 'Presupuesto Aceptado' : 'Presupuesto Rechazado'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal del Calendario */}
            {calendarioAbierto && presupuestoSeleccionado && (
                <CalendarioHorarios
                    profesionalId={presupuestoSeleccionado.profesional_persona_id}
                    duracion={presupuestoSeleccionado.duracion}
                    onHorarioSeleccionado={manejarSeleccionHorario}
                    onCerrar={cerrarCalendario}
                />
            )}
        </div>
    );
};

export default MisPresupuestos;


