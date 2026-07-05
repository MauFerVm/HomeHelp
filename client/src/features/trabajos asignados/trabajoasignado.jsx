import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './trabajoasginado.css';
import CalificacionModal from '../../components/CalificacionModal';
import ConfirmModal from '../../components/ConfirmModal';
import CalificacionSuccessModal from '../../components/CalificacionSuccessModal';
import {
    FaArrowLeft,
    FaMapMarkerAlt,
    FaClock,
    FaUser,
    FaCalendarAlt,
    FaSpinner,
    FaEye,
    FaDollarSign,
    FaBriefcase,
    FaCheckCircle,
    FaHourglassHalf,
    FaTimesCircle,
    FaStar,
    FaFilter
} from 'react-icons/fa';

const TrabajosAsignados = ({ 
    isTab = false, 
    onClose = null 
}) => {
    const navigate = useNavigate();
    const [ordenesTrabajos, setOrdenesTrabajos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrden, setSelectedOrden] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const [personaId, setPersonaId] = useState(null);
    const [cerrandoOrden, setCerrandoOrden] = useState(false);
    const [cancelandoOrden, setCancelandoOrden] = useState(false);
    const [showCalificacionModal, setShowCalificacionModal] = useState(false);
    const [yaCalificado, setYaCalificado] = useState(false);
    const [ordenesCalificadas, setOrdenesCalificadas] = useState({}); // Mapa de ordenId -> boolean
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmTitle, setConfirmTitle] = useState('');
    const [showCalificacionSuccessModal, setShowCalificacionSuccessModal] = useState(false);
    const [filtros, setFiltros] = useState({
        cliente: '',
        dias: '',
        estado: ''
    });
    const [showFiltros, setShowFiltros] = useState(false);
    const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);

    // Obtener datos del usuario del localStorage
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                setUserData(JSON.parse(storedUserData));
            } catch (error) {
                console.error('Error al parsear userData:', error);
            }
        }
    }, []);

    // Obtener el persona_id basado en el usuario_id
    useEffect(() => {
        const fetchPersonaId = async () => {
            if (userData?.id) {
                try {
                    console.log('Obteniendo persona_id para usuario_id:', userData.id);
                    const response = await fetch(`http://localhost:3002/api/auth/persona/${userData.id}`);
                    const data = await response.json();
                    
                    console.log('Respuesta de persona:', data);
                    if (data.success && data.data) {
                        console.log('persona_id obtenido:', data.data.id);
                        setPersonaId(data.data.id);
                    }
                } catch (error) {
                    console.error('Error al obtener persona_id:', error);
                }
            }
        };

        fetchPersonaId();
    }, [userData]);

    // Cargar órdenes de trabajo del profesional
    useEffect(() => {
        if (personaId) {
            fetchOrdenesTrabajos();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personaId]);

    // Aplicar filtros cuando cambien los filtros o las órdenes
    useEffect(() => {
        if (ordenesTrabajos.length > 0) {
            aplicarFiltros();
        } else {
            setOrdenesFiltradas([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros, ordenesTrabajos]);

    const fetchOrdenesTrabajos = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!personaId) {
                throw new Error('No se encontró el ID del profesional');
            }

            console.log('Obteniendo órdenes de trabajo para profesional_id:', personaId);
            const response = await fetch(`http://localhost:3002/api/ordenes/profesional/${personaId}`);
            const data = await response.json();

            console.log('Respuesta de órdenes de trabajo:', data);
            if (data.success) {
                console.log('Órdenes de trabajo obtenidas:', data.data.length);
                const ordenes = data.data.filter(orden => orden.estado !== 'cancelado');
                setOrdenesTrabajos(ordenes);
                
                // Verificar calificaciones para órdenes completadas
                if (personaId) {
                    const calificacionesMap = {};
                    const verificaciones = ordenes
                        .filter(orden => orden.estado === 'completado' && orden.cliente_persona_id)
                        .map(async (orden) => {
                            try {
                                const response = await fetch(
                                    `http://localhost:3002/api/calificaciones/verificar?solicitud_id=${orden.solicitud_id}&calificador_persona_id=${personaId}&calificado_persona_id=${orden.cliente_persona_id}`
                                );
                                const data = await response.json();
                                calificacionesMap[orden.id] = data.success && data.data.existe;
                            } catch (error) {
                                console.error(`Error al verificar calificación para orden ${orden.id}:`, error);
                                calificacionesMap[orden.id] = false;
                            }
                        });
                    
                    await Promise.all(verificaciones);
                    setOrdenesCalificadas(calificacionesMap);
                }
            } else {
                throw new Error(data.message || 'Error al obtener las órdenes de trabajo');
            }
        } catch (error) {
            console.error('Error al cargar órdenes de trabajo:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerDetalle = async (orden) => {
        setSelectedOrden(orden);
        setShowModal(true);
        
        // Verificar si ya existe una calificación solo para órdenes completadas
        if (orden.estado === 'completado' && personaId && orden.cliente_persona_id) {
            try {
                const response = await fetch(
                    `http://localhost:3002/api/calificaciones/verificar?solicitud_id=${orden.solicitud_id}&calificador_persona_id=${personaId}&calificado_persona_id=${orden.cliente_persona_id}`
                );
                const data = await response.json();
                setYaCalificado(data.success && data.data.existe);
            } catch (error) {
                console.error('Error al verificar calificación:', error);
                setYaCalificado(false);
            }
        } else {
            setYaCalificado(false);
        }
    };

    const handleCalificarCliente = (orden) => {
        if (orden && orden.cliente_persona_id) {
            setSelectedOrden(orden);
            setShowCalificacionModal(true);
        }
    };

    const handleCalificacionEnviada = () => {
        if (selectedOrden) {
            setOrdenesCalificadas(prev => ({
                ...prev,
                [selectedOrden.id]: true
            }));
        }
        setYaCalificado(true);
        fetchOrdenesTrabajos();
        // Mostrar modal de éxito
        setShowCalificacionSuccessModal(true);
    };

    const handleCerrarOrden = () => {
        if (!selectedOrden) return;
        setConfirmTitle('Cerrar Orden de Trabajo');
        setConfirmMessage('¿Estás seguro de que deseas cerrar esta orden de trabajo?');
        setConfirmAction(() => ejecutarCerrarOrden);
        setShowConfirmModal(true);
    };

    const ejecutarCerrarOrden = async () => {
        if (!selectedOrden) return;

        try {
            setCerrandoOrden(true);
            const response = await fetch(`http://localhost:3002/api/ordenes/${selectedOrden.id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: 'cerradoprofesional' })
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar la lista de órdenes
                await fetchOrdenesTrabajos();
                // Cerrar el modal de detalles
                setShowModal(false);
                // NO mostrar modal de calificación - solo se califica al cerrar definitivamente
            } else {
                throw new Error(data.message || 'Error al cerrar la orden de trabajo');
            }
        } catch (error) {
            console.error('Error al cerrar orden de trabajo:', error);
            alert('Error al cerrar la orden de trabajo: ' + error.message);
        } finally {
            setCerrandoOrden(false);
        }
    };

    const handleCerrarDefinitivamente = () => {
        if (!selectedOrden) return;
        setConfirmTitle('Cerrar Definitivamente');
        setConfirmMessage('¿Estás seguro de que deseas cerrar definitivamente esta orden de trabajo? Esta acción no se puede deshacer.');
        setConfirmAction(() => ejecutarCerrarDefinitivamente);
        setShowConfirmModal(true);
    };

    const ejecutarCerrarDefinitivamente = async () => {
        if (!selectedOrden) return;

        try {
            setCerrandoOrden(true);
            const response = await fetch(`http://localhost:3002/api/ordenes/${selectedOrden.id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: 'completado' })
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar la lista de órdenes
                await fetchOrdenesTrabajos();
                // Cerrar el modal de detalles
                setShowModal(false);
                // No mostrar modal de calificación automáticamente - el botón estará en la tarjeta
            } else {
                throw new Error(data.message || 'Error al cerrar definitivamente la orden de trabajo');
            }
        } catch (error) {
            console.error('Error al cerrar definitivamente orden de trabajo:', error);
            alert('Error al cerrar definitivamente la orden de trabajo: ' + error.message);
        } finally {
            setCerrandoOrden(false);
        }
    };

    const handleCancelarOrden = (orden = selectedOrden) => {
        if (!orden) return;
        setSelectedOrden(orden);
        setConfirmTitle('Cancelar Orden de Trabajo');
        setConfirmMessage('¿Estás seguro de que deseas cancelar esta orden de trabajo? Se liberará el horario en tu agenda y el cliente será notificado.');
        setConfirmAction(() => () => ejecutarCancelarOrden(orden));
        setShowConfirmModal(true);
    };

    const ejecutarCancelarOrden = async (orden = selectedOrden) => {
        if (!orden || !personaId) return;

        try {
            setCancelandoOrden(true);
            const response = await fetch(`http://localhost:3002/api/ordenes/${orden.id}/cancelar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profesionalPersonaId: personaId })
            });

            const data = await response.json();

            if (data.success) {
                await fetchOrdenesTrabajos();
                setShowModal(false);
            } else {
                throw new Error(data.message || 'Error al cancelar la orden de trabajo');
            }
        } catch (error) {
            console.error('Error al cancelar orden de trabajo:', error);
            alert('Error al cancelar la orden de trabajo: ' + error.message);
        } finally {
            setCancelandoOrden(false);
        }
    };

    const handleConfirmAction = () => {
        if (confirmAction) {
            confirmAction();
        }
    };

    const ESTADOS_CERRABLES = ['pendiente', 'reprogramado', 'represupuestada', 'en_curso'];
    const ESTADOS_CANCELABLES = ['pendiente', 'reprogramado', 'represupuestada'];

    const puedeCerrarOrden = (orden) => ESTADOS_CERRABLES.includes(orden.estado);

    const puedeCancelarOrden = (orden) => {
        if (!ESTADOS_CANCELABLES.includes(orden.estado)) {
            return false;
        }

        if (!orden.fecha_programada || !orden.horarioInicio) {
            return false;
        }

        const fechaStr = String(orden.fecha_programada).split('T')[0];
        const horaStr = formatHora(orden.horarioInicio);
        const inicioOrden = new Date(`${fechaStr}T${horaStr}:00`);
        const horasRestantes = (inicioOrden.getTime() - Date.now()) / (1000 * 60 * 60);

        return horasRestantes >= 48;
    };

    // Aplicar filtros a las órdenes
    const aplicarFiltros = () => {
        if (ordenesTrabajos.length === 0) {
            setOrdenesFiltradas([]);
            return;
        }

        let resultado = [...ordenesTrabajos];

        // Filtro por nombre de cliente
        if (filtros.cliente && filtros.cliente.trim() !== '') {
            const nombreCliente = filtros.cliente.toLowerCase().trim();
            resultado = resultado.filter(orden => 
                orden.cliente_nombre && 
                orden.cliente_nombre.toLowerCase().includes(nombreCliente)
            );
        }

        // Filtro por estado
        if (filtros.estado && filtros.estado !== '') {
            resultado = resultado.filter(orden => orden.estado === filtros.estado);
        }

        // Filtro por fecha (últimos X días)
        if (filtros.dias && filtros.dias !== '') {
            const diasAtras = parseInt(filtros.dias);
            if (!isNaN(diasAtras)) {
                const fechaLimite = new Date();
                fechaLimite.setDate(fechaLimite.getDate() - diasAtras);
                fechaLimite.setHours(0, 0, 0, 0);
                
                resultado = resultado.filter(orden => {
                    if (!orden.creado_en) return false;
                    const fechaOrden = new Date(orden.creado_en);
                    fechaOrden.setHours(0, 0, 0, 0);
                    return fechaOrden >= fechaLimite;
                });
            }
        }

        setOrdenesFiltradas(resultado);
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            cliente: '',
            dias: '',
            estado: ''
        });
    };

    const formatFecha = (fecha) => {
        if (!fecha) return 'Sin fecha';
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatHora = (hora) => {
        if (!hora) return '';
        // Formato de hora HH:MM:SS a HH:MM
        return hora.substring(0, 5);
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente':
                return '#ffaa00';
            case 'en_curso':
                return '#2196F3';
            case 'completado':
                return '#28a745';
            case 'cancelado':
                return '#ff4444';
            case 'represupuestada':
                return '#9c27b0';
            case 'reprogramado':
                return '#ff9800';
            case 'cerradoprofesional':
                return '#28a745';
            case 'cerradocliente':
                return '#28a745';
            case 'calificada':
                return '#673ab7';
            default:
                return '#666';
        }
    };

    const getEstadoIcon = (estado) => {
        switch (estado) {
            case 'pendiente':
                return <FaHourglassHalf />;
            case 'en_curso':
                return <FaBriefcase />;
            case 'completado':
                return <FaCheckCircle />;
            case 'cancelado':
                return <FaTimesCircle />;
            case 'represupuestada':
                return <FaDollarSign />;
            case 'reprogramado':
                return <FaClock />;
            case 'cerradoprofesional':
                return <FaCheckCircle />;
            case 'cerradocliente':
                return <FaCheckCircle />;
            case 'calificada':
                return <FaStar />;
            default:
                return <FaClock />;
        }
    };

    const getEstadoTexto = (estado) => {
        switch (estado) {
            case 'pendiente':
                return 'Pendiente';
            case 'en_curso':
                return 'En Curso';
            case 'completado':
                return 'Completado';
            case 'cancelado':
                return 'Cancelado';
            case 'represupuestada':
                return 'Represupuestada';
            case 'reprogramado':
                return 'Reprogramado';
            case 'cerradoprofesional':
                return 'Cerrado por Profesional';
            case 'cerradocliente':
                return 'Cerrado por Cliente';
            case 'calificada':
                return 'Calificada';
            default:
                return estado;
        }
    };

    if (loading) {
        return (
            <div className={isTab ? "trabajos-asignados-tab" : "trabajos-asignados-container"}>
                {!isTab && (
                    <div className="trabajos-asignados-header">
                        <button 
                            className="back-button"
                            onClick={() => navigate('/main')}
                        >
                            <FaArrowLeft />
                            Volver al Dashboard
                        </button>
                        <h1>Trabajos Asignados</h1>
                        <p>Órdenes de trabajo que tienes asignadas</p>
                    </div>
                )}
                {isTab && (
                    <div className="tab-header">
                        <h2>Trabajos Asignados</h2>
                        <p>Órdenes de trabajo que tienes asignadas</p>
                    </div>
                )}
                <div className="loading-container">
                    <FaSpinner className="spinner" />
                    <p>Cargando trabajos asignados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={isTab ? "trabajos-asignados-tab" : "trabajos-asignados-container"}>
                {!isTab && (
                    <div className="trabajos-asignados-header">
                        <button 
                            className="back-button"
                            onClick={() => navigate('/main')}
                        >
                            <FaArrowLeft />
                            Volver al Dashboard
                        </button>
                        <h1>Trabajos Asignados</h1>
                        <p>Órdenes de trabajo que tienes asignadas</p>
                    </div>
                )}
                {isTab && (
                    <div className="tab-header">
                        <h2>Trabajos Asignados</h2>
                        <p>Órdenes de trabajo que tienes asignadas</p>
                    </div>
                )}
                <div className="error-container">
                    <h2>Error al cargar trabajos</h2>
                    <p>{error}</p>
                    <button onClick={fetchOrdenesTrabajos} className="retry-button">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={isTab ? "trabajos-asignados-tab" : "trabajos-asignados-container"}>
            {/* Header */}
            {!isTab && (
                <div className="trabajos-asignados-header">
                    <button 
                        className="back-button"
                        onClick={() => navigate('/main')}
                    >
                        <FaArrowLeft />
                        Volver al Dashboard
                    </button>
                    <h1>Trabajos Asignados</h1>
                    <p>Órdenes de trabajo que tienes asignadas</p>
                </div>
            )}
            {isTab && (
                <div className="tab-header">
                    <h2>Trabajos Asignados</h2>
                    <p>Órdenes de trabajo que tienes asignadas</p>
                </div>
            )}

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
                            <label htmlFor="filtro-cliente">Cliente:</label>
                            <input
                                type="text"
                                id="filtro-cliente"
                                value={filtros.cliente}
                                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                                placeholder="Buscar por nombre de cliente"
                                className="filtro-input-text"
                            />
                        </div>

                        <div className="filtro-grupo">
                            <label htmlFor="filtro-dias">Últimos días:</label>
                            <select
                                id="filtro-dias"
                                value={filtros.dias}
                                onChange={(e) => handleFiltroChange('dias', e.target.value)}
                            >
                                <option value="">Todas las fechas</option>
                                <option value="5">Últimos 5 días</option>
                                <option value="15">Últimos 15 días</option>
                                <option value="20">Últimos 20 días</option>
                            </select>
                        </div>

                        <div className="filtro-grupo">
                            <label htmlFor="filtro-estado">Estado:</label>
                            <select
                                id="filtro-estado"
                                value={filtros.estado}
                                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="represupuestada">Represupuestada</option>
                                <option value="en_curso">En Curso</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                                <option value="reprogramado">Reprogramado</option>
                                <option value="cerradoprofesional">Cerrado por Profesional</option>
                                <option value="cerradocliente">Cerrado por Cliente</option>
                                <option value="calificada">Calificada</option>
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

            {/* Lista de órdenes de trabajo */}
            <div className="ordenes-list">
                {ordenesTrabajos.length === 0 ? (
                    <div className="no-ordenes">
                        <FaBriefcase className="no-ordenes-icon" />
                        <h3>No tienes trabajos asignados</h3>
                        <p>Aún no tienes órdenes de trabajo asignadas.</p>
                    </div>
                ) : ordenesFiltradas.length === 0 ? (
                    <div className="no-ordenes">
                        <FaBriefcase className="no-ordenes-icon" />
                        <h3>No hay trabajos que coincidan con los filtros</h3>
                        <p>Intenta ajustar los filtros de búsqueda.</p>
                    </div>
                ) : (
                    ordenesFiltradas.map((orden) => (
                        <div key={orden.id} className="orden-card">
                            <div className="orden-header">
                                <h3 className="orden-titulo">{orden.solicitud_titulo}</h3>
                                <div className="orden-estado" style={{ color: getEstadoColor(orden.estado) }}>
                                    {getEstadoIcon(orden.estado)}
                                    <span>{getEstadoTexto(orden.estado)}</span>
                                </div>
                            </div>

                            <div className="orden-info">
                                <div className="info-item">
                                    <FaUser className="info-icon" />
                                    <span><strong>Cliente:</strong> {orden.cliente_nombre}</span>
                                </div>
                                <div className="info-item">
                                    <FaMapMarkerAlt className="info-icon" />
                                    <span><strong>Dirección:</strong> {orden.direccion}</span>
                                </div>
                                <div className="info-item">
                                    <FaCalendarAlt className="info-icon" />
                                    <span><strong>Fecha:</strong> {formatFecha(orden.fecha_programada)}</span>
                                </div>
                                <div className="info-item">
                                    <FaClock className="info-icon" />
                                    <span><strong>Horario:</strong> {formatHora(orden.horarioInicio)} - {formatHora(orden.horaFin)}</span>
                                </div>
                                <div className="info-item">
                                    <FaDollarSign className="info-icon" />
                                    <span><strong>Monto:</strong> ${parseFloat(orden.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="orden-descripcion">
                                <p>{orden.descripcion}</p>
                            </div>

                            <div className="orden-actions">
                                {puedeCancelarOrden(orden) && (
                                    <button 
                                        className="cancelar-orden-button-card"
                                        onClick={() => handleCancelarOrden(orden)}
                                        disabled={cancelandoOrden}
                                    >
                                        <FaTimesCircle />
                                        Cancelar Orden
                                    </button>
                                )}
                                {orden.estado === 'completado' && 
                                 orden.cliente_persona_id && 
                                 !ordenesCalificadas[orden.id] && (
                                    <button 
                                        className="calificar-button-card"
                                        onClick={() => handleCalificarCliente(orden)}
                                    >
                                        <FaStar />
                                        Calificar Cliente
                                    </button>
                                )}
                                <button 
                                    className="ver-detalle-button"
                                    onClick={() => handleVerDetalle(orden)}
                                >
                                    <FaEye />
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de detalles */}
            {showModal && selectedOrden && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalles de la Orden de Trabajo</h2>
                            <button 
                                className="close-button"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detalle-section">
                                <h3>{selectedOrden.solicitud_titulo}</h3>
                                <div className="detalle-estado" style={{ color: getEstadoColor(selectedOrden.estado) }}>
                                    {getEstadoIcon(selectedOrden.estado)}
                                    <span>Estado: {getEstadoTexto(selectedOrden.estado)}</span>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Descripción del Trabajo</h4>
                                <p className="descripcion-text">{selectedOrden.descripcion}</p>
                            </div>

                            <div className="detalle-section">
                                <h4>Información del Cliente</h4>
                                <div className="cliente-info">
                                    <div className="info-item">
                                        <FaUser className="info-icon" />
                                        <span>{selectedOrden.cliente_nombre}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Ubicación</h4>
                                <div className="ubicacion-info">
                                    <FaMapMarkerAlt className="info-icon" />
                                    <span>{selectedOrden.direccion}</span>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Fecha y Horario</h4>
                                <div className="fecha-horario-info">
                                    <div className="info-item">
                                        <FaCalendarAlt className="info-icon" />
                                        <span>{formatFecha(selectedOrden.fecha_programada)}</span>
                                    </div>
                                    <div className="info-item">
                                        <FaClock className="info-icon" />
                                        <span>{formatHora(selectedOrden.horarioInicio)} - {formatHora(selectedOrden.horaFin)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Monto</h4>
                                <div className="monto-info">
                                    <FaDollarSign className="info-icon" />
                                    <span className="monto-valor">{parseFloat(selectedOrden.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Información Adicional</h4>
                                <div className="info-adicional">
                                    <p><strong>ID Orden:</strong> #{selectedOrden.id}</p>
                                    <p><strong>Creada el:</strong> {formatFecha(selectedOrden.creado_en)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            {puedeCerrarOrden(selectedOrden) && (
                                <button 
                                    className="cerrar-orden-button"
                                    onClick={handleCerrarOrden}
                                    disabled={cerrandoOrden}
                                >
                                    {cerrandoOrden ? (
                                        <>
                                            <FaSpinner className="spinner-small" />
                                            Cerrando...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle />
                                            Cerrar Orden de Trabajo
                                        </>
                                    )}
                                </button>
                            )}
                            {selectedOrden.estado === 'cerradocliente' && (
                                <button 
                                    className="cerrar-definitivamente-button"
                                    onClick={handleCerrarDefinitivamente}
                                    disabled={cerrandoOrden}
                                >
                                    {cerrandoOrden ? (
                                        <>
                                            <FaSpinner className="spinner-small" />
                                            Cerrando...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle />
                                            Cerrar Definitivamente
                                        </>
                                    )}
                                </button>
                            )}
                            <button 
                                className="cancel-button"
                                onClick={() => setShowModal(false)}
                                disabled={cerrandoOrden || cancelandoOrden}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Calificación */}
            {showCalificacionModal && selectedOrden && (
                <CalificacionModal
                    isOpen={showCalificacionModal}
                    onClose={() => {
                        setShowCalificacionModal(false);
                        setSelectedOrden(null);
                    }}
                    solicitudId={selectedOrden.solicitud_id}
                    calificadorPersonaId={personaId}
                    calificadoPersonaId={selectedOrden.cliente_persona_id}
                    calificadoNombre={selectedOrden.cliente_nombre}
                    onCalificacionEnviada={handleCalificacionEnviada}
                />
            )}

            {/* Modal de Confirmación */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmAction}
                title={confirmTitle}
                message={confirmMessage}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />

            {/* Modal de Éxito de Calificación */}
            <CalificacionSuccessModal
                isOpen={showCalificacionSuccessModal}
                onClose={() => setShowCalificacionSuccessModal(false)}
            />
        </div>
    );
};

export default TrabajosAsignados;

