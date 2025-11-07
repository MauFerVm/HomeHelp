import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../trabajos asignados/trabajoasginado.css';
import CalificacionModal from '../../components/CalificacionModal';
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
    FaStar
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
                setOrdenesTrabajos(data.data);
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

    const handleCalificarProfesional = () => {
        if (selectedOrden && selectedOrden.profesional_id) {
            setShowCalificacionModal(true);
        }
    };

    const handleCalificacionEnviada = () => {
        setYaCalificado(true);
        fetchOrdenesTrabajos();
    };

    const handleCerrarOrden = async () => {
        if (!selectedOrden) return;

        // Confirmar acción
        const confirmar = window.confirm('¿Estás seguro de que deseas cerrar esta orden de trabajo?');
        if (!confirmar) return;

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

    const handleCerrarDefinitivamente = async () => {
        if (!selectedOrden) return;

        // Confirmar acción
        const confirmar = window.confirm('¿Estás seguro de que deseas cerrar definitivamente esta orden de trabajo? Esta acción no se puede deshacer.');
        if (!confirmar) return;

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
                // Mostrar modal de calificación automáticamente (el cliente califica al profesional)
                setShowCalificacionModal(true);
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

            {/* Lista de órdenes de trabajo */}
            <div className="ordenes-list">
                {ordenesTrabajos.length === 0 ? (
                    <div className="no-ordenes">
                        <FaBriefcase className="no-ordenes-icon" />
                        <h3>No tienes servicios contratados</h3>
                        <p>Aún no tienes órdenes de trabajo asociadas a tus solicitudes.</p>
                    </div>
                ) : (
                    ordenesTrabajos.map((orden) => (
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
                                    <span className="monto-valor">${parseFloat(selectedOrden.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
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
                            {selectedOrden.estado === 'pendiente' && (
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
                            {selectedOrden.estado === 'completado' && !yaCalificado && (
                                <button 
                                    className="calificar-button"
                                    onClick={handleCalificarProfesional}
                                    disabled={cerrandoOrden}
                                >
                                    <FaStar />
                                    Calificar Profesional
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
        </div>
    );
};

export default MisServicios;

