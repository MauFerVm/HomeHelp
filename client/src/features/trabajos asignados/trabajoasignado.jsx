import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './trabajoasginado.css';
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
    FaTimesCircle
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

    const handleVerDetalle = (orden) => {
        setSelectedOrden(orden);
        setShowModal(true);
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

            {/* Lista de órdenes de trabajo */}
            <div className="ordenes-list">
                {ordenesTrabajos.length === 0 ? (
                    <div className="no-ordenes">
                        <FaBriefcase className="no-ordenes-icon" />
                        <h3>No tienes trabajos asignados</h3>
                        <p>Aún no tienes órdenes de trabajo asignadas.</p>
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
                            <button 
                                className="cancel-button"
                                onClick={() => setShowModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrabajosAsignados;

