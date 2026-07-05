import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../trabajos asignados/trabajoasginado.css';
import CalificacionModal from '../../components/CalificacionModal';
import ConfirmModal from '../../components/ConfirmModal';
import CalificacionSuccessModal from '../../components/CalificacionSuccessModal';
import SuccessModal from '../../components/SuccessModal';
import CalendarioHorarios from '../../components/CalendarioHorarios';
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
    FaFilter,
    FaEdit
} from 'react-icons/fa';

const MisServicios = ({ 
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
    const [showCalificacionModal, setShowCalificacionModal] = useState(false);
    const [yaCalificado, setYaCalificado] = useState(false);
    const [ordenesCalificadas, setOrdenesCalificadas] = useState({}); // Mapa de ordenId -> boolean
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmTitle, setConfirmTitle] = useState('');
    const [showCalificacionSuccessModal, setShowCalificacionSuccessModal] = useState(false);
    const [showReprogramacionSuccessModal, setShowReprogramacionSuccessModal] = useState(false);
    const [filtros, setFiltros] = useState({
        profesional: '',
        dias: '',
        estado: ''
    });
    const [showFiltros, setShowFiltros] = useState(false);
    const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);
    const [calendarioAbierto, setCalendarioAbierto] = useState(false);
    const [ordenParaReprogramar, setOrdenParaReprogramar] = useState(null);
    const [reprogramandoHorario, setReprogramandoHorario] = useState(false);

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

    // Cargar órdenes de trabajo del cliente
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
                throw new Error('No se encontró el ID del cliente');
            }

            console.log('Obteniendo órdenes de trabajo para cliente_id:', personaId);
            const response = await fetch(`http://localhost:3002/api/ordenes/cliente/${personaId}`);
            const data = await response.json();

            console.log('Respuesta de órdenes de trabajo:', data);
            if (data.success) {
                console.log('Órdenes de trabajo obtenidas:', data.data.length);
                const ordenes = data.data;
                setOrdenesTrabajos(ordenes);
                
                // Verificar calificaciones para órdenes completadas
                if (personaId) {
                    const calificacionesMap = {};
                    const verificaciones = ordenes
                        .filter(orden => orden.estado === 'completado' && orden.profesional_id)
                        .map(async (orden) => {
                            try {
                                const response = await fetch(
                                    `http://localhost:3002/api/calificaciones/verificar?solicitud_id=${orden.solicitud_id}&calificador_persona_id=${personaId}&calificado_persona_id=${orden.profesional_id}`
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
        if (orden.estado === 'completado' && personaId && orden.profesional_id) {
            try {
                const response = await fetch(
                    `http://localhost:3002/api/calificaciones/verificar?solicitud_id=${orden.solicitud_id}&calificador_persona_id=${personaId}&calificado_persona_id=${orden.profesional_id}`
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

    const handleCalificarProfesional = (orden) => {
        if (orden && orden.profesional_id) {
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
                body: JSON.stringify({ estado: 'cerradocliente' })
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

    const handleConfirmAction = () => {
        if (confirmAction) {
            confirmAction();
        }
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

    const calcularDuracionOrden = (orden) => {
        if (orden.presupuesto_duracion && orden.presupuesto_duracion > 0) {
            return orden.presupuesto_duracion;
        }

        if (orden.horarioInicio && orden.horaFin) {
            const [h1, m1] = orden.horarioInicio.split(':').map(Number);
            const [h2, m2] = orden.horaFin.split(':').map(Number);
            const minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (minutos > 0) return minutos;
        }

        return 120;
    };

    const puedeModificarHorario = (orden) => {
        if (!['pendiente', 'reprogramado'].includes(orden.estado)) {
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

    const ESTADOS_CERRABLES = ['pendiente', 'reprogramado', 'represupuestada', 'en_curso'];

    const puedeCerrarOrden = (orden) => ESTADOS_CERRABLES.includes(orden.estado);

    const abrirCalendarioReprogramacion = (orden) => {
        setOrdenParaReprogramar(orden);
        setCalendarioAbierto(true);
    };

    const cerrarCalendarioReprogramacion = () => {
        setCalendarioAbierto(false);
        setOrdenParaReprogramar(null);
    };

    const manejarReprogramacionHorario = async (horarioSeleccionado) => {
        if (!ordenParaReprogramar || !personaId) return;

        try {
            setReprogramandoHorario(true);

            const response = await fetch(
                `http://localhost:3002/api/ordenes/${ordenParaReprogramar.id}/reprogramar`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fecha: horarioSeleccionado.fecha,
                        horaInicio: horarioSeleccionado.horaInicio,
                        horaFin: horarioSeleccionado.horaFin,
                        clientePersonaId: personaId
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                const ordenIdReprogramada = ordenParaReprogramar.id;
                cerrarCalendarioReprogramacion();
                if (showModal && selectedOrden?.id === ordenIdReprogramada) {
                    setShowModal(false);
                    setSelectedOrden(null);
                }
                await fetchOrdenesTrabajos();
                setShowReprogramacionSuccessModal(true);
            } else {
                throw new Error(data.message || 'Error al reprogramar el horario');
            }
        } catch (error) {
            console.error('Error al reprogramar horario:', error);
            alert('Error al reprogramar el horario: ' + error.message);
        } finally {
            setReprogramandoHorario(false);
        }
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

    const aplicarFiltros = () => {
        if (ordenesTrabajos.length === 0) {
            setOrdenesFiltradas([]);
            return;
        }

        let resultado = [...ordenesTrabajos];

        // Filtro por nombre de profesional
        if (filtros.profesional && filtros.profesional.trim() !== '') {
            const nombreProfesional = filtros.profesional.toLowerCase().trim();
            resultado = resultado.filter(orden => 
                orden.profesional_nombre && 
                orden.profesional_nombre.toLowerCase().includes(nombreProfesional)
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
            profesional: '',
            dias: '',
            estado: ''
        });
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
                        <h1>Mis Servicios</h1>
                        <p>Órdenes de trabajo asociadas a tus solicitudes</p>
                    </div>
                )}
                {isTab && (
                    <div className="tab-header">
                        <h2>Mis Servicios</h2>
                        <p>Órdenes de trabajo asociadas a tus solicitudes</p>
                    </div>
                )}
                <div className="loading-container">
                    <FaSpinner className="spinner" />
                    <p>Cargando servicios...</p>
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
                        <h1>Mis Servicios</h1>
                        <p>Órdenes de trabajo asociadas a tus solicitudes</p>
                    </div>
                )}
                {isTab && (
                    <div className="tab-header">
                        <h2>Mis Servicios</h2>
                        <p>Órdenes de trabajo asociadas a tus solicitudes</p>
                    </div>
                )}
                <div className="error-container">
                    <h2>Error al cargar servicios</h2>
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
                    <h1>Mis Servicios</h1>
                    <p>Órdenes de trabajo asociadas a tus solicitudes</p>
                </div>
            )}
            {isTab && (
                <div className="tab-header">
                    <h2>Mis Servicios</h2>
                    <p>Órdenes de trabajo asociadas a tus solicitudes</p>
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
                            <label htmlFor="filtro-profesional">Profesional:</label>
                            <input
                                type="text"
                                id="filtro-profesional"
                                value={filtros.profesional}
                                onChange={(e) => handleFiltroChange('profesional', e.target.value)}
                                placeholder="Buscar por nombre de profesional"
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
                {(() => {
                    // Determinar si hay filtros activos
                    const hayFiltrosActivos = filtros.profesional.trim() !== '' || 
                                            filtros.dias !== '' || 
                                            filtros.estado !== '';
                    
                    // Usar órdenes filtradas si hay filtros activos, sino usar todas las órdenes
                    const ordenesAMostrar = hayFiltrosActivos ? ordenesFiltradas : ordenesTrabajos;
                    
                    if (ordenesTrabajos.length === 0) {
                        return (
                            <div className="no-ordenes">
                                <FaBriefcase className="no-ordenes-icon" />
                                <h3>No tienes servicios contratados</h3>
                                <p>Aún no tienes órdenes de trabajo asociadas a tus solicitudes.</p>
                            </div>
                        );
                    }
                    
                    if (hayFiltrosActivos && ordenesFiltradas.length === 0) {
                        return (
                            <div className="no-ordenes">
                                <FaBriefcase className="no-ordenes-icon" />
                                <h3>No se encontraron servicios</h3>
                                <p>No hay órdenes de trabajo que coincidan con los filtros aplicados.</p>
                            </div>
                        );
                    }
                    
                    return ordenesAMostrar.map((orden) => (
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
                                    <span><strong>Profesional:</strong> {orden.profesional_nombre}</span>
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
                                {puedeModificarHorario(orden) && (
                                    <button
                                        className="reprogramar-button-card"
                                        onClick={() => abrirCalendarioReprogramacion(orden)}
                                        disabled={reprogramandoHorario}
                                    >
                                        <FaEdit />
                                        Modificar Horario
                                    </button>
                                )}
                                {orden.estado === 'completado' && 
                                 orden.profesional_id && 
                                 !ordenesCalificadas[orden.id] && (
                                    <button 
                                        className="calificar-button-card"
                                        onClick={() => handleCalificarProfesional(orden)}
                                    >
                                        <FaStar />
                                        Calificar Profesional
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
                    ));
                })()}
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
                                <h4>Información del Profesional</h4>
                                <div className="cliente-info">
                                    <div className="info-item">
                                        <FaUser className="info-icon" />
                                        <span>{selectedOrden.profesional_nombre}</span>
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
                            {selectedOrden.estado === 'cerradoprofesional' && (
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
                                disabled={cerrandoOrden}
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
                    calificadoPersonaId={selectedOrden.profesional_id}
                    calificadoNombre={selectedOrden.profesional_nombre}
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

            <SuccessModal
                isOpen={showReprogramacionSuccessModal}
                onClose={() => setShowReprogramacionSuccessModal(false)}
                title="¡Horario reprogramado exitosamente!"
                message="El profesional fue notificado."
            />

            {calendarioAbierto && ordenParaReprogramar && (
                <CalendarioHorarios
                    profesionalId={ordenParaReprogramar.profesional_id}
                    duracion={calcularDuracionOrden(ordenParaReprogramar)}
                    ordenId={ordenParaReprogramar.id}
                    titulo="Modificar Horario"
                    textoConfirmar={reprogramandoHorario ? 'Procesando...' : 'Confirmar Cambio'}
                    onHorarioSeleccionado={manejarReprogramacionHorario}
                    onCerrar={cerrarCalendarioReprogramacion}
                />
            )}
        </div>
    );
};

export default MisServicios;

