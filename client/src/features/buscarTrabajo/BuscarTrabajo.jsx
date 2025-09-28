import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BuscarTrabajo.css';
import {
    FaArrowLeft,
    FaMapMarkerAlt,
    FaClock,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaCalendarAlt,
    FaExclamationTriangle,
    FaCheckCircle,
    FaSpinner,
    FaEye,
    FaHandshake
} from 'react-icons/fa';

const BuscarTrabajo = ({ 
    isTab = false, // Prop para determinar si es pestaña o página completa
    onClose = null // Función para cerrar si es pestaña
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userData, setUserData] = useState(null);

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

    // Cargar solicitudes disponibles para el profesional
    useEffect(() => {
        fetchSolicitudesDisponibles();
    }, []);

    const fetchSolicitudesDisponibles = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtener el ID del usuario del localStorage
            const userDataRaw = localStorage.getItem('userData');
            if (!userDataRaw) {
                throw new Error('No se encontraron datos del usuario');
            }

            const user = JSON.parse(userDataRaw);
            if (!user.id) {
                throw new Error('No se encontró el ID del usuario');
            }

            // Usar el nuevo endpoint específico para profesionales
            const response = await fetch(`http://localhost:3002/api/solicitudes/disponibles/${user.id}`);
            const data = await response.json();

            if (data.success) {
                setSolicitudes(data.data);
            } else {
                throw new Error(data.message || 'Error al obtener las solicitudes');
            }
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerDetalle = async (solicitud) => {
        try {
            // Use the solicitud data that already contains client information
            setSelectedSolicitud({
                solicitud: solicitud,
                historial: [] // We can add historial later if needed
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error al mostrar detalles:', error);
            alert('Error al mostrar los detalles de la solicitud: ' + error.message);
        }
    };

    const handleAplicarTrabajo = async (solicitudId) => {
        try {
            // Aquí implementarías la lógica para aplicar al trabajo
            // Por ahora solo mostramos un mensaje
            alert('Funcionalidad de aplicación al trabajo en desarrollo');
            
            // Cerrar modal
            setShowModal(false);
            setSelectedSolicitud(null);
        } catch (error) {
            console.error('Error al aplicar al trabajo:', error);
            alert('Error al aplicar al trabajo: ' + error.message);
        }
    };

    const formatFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    if (loading) {
        return (
            <div className={isTab ? "buscar-trabajo-tab" : "buscar-trabajo-container"}>
                {!isTab && (
                    <div className="buscar-trabajo-header">
                        <button 
                            className="back-button"
                            onClick={() => navigate('/main')}
                        >
                            <FaArrowLeft />
                            Volver al Dashboard
                        </button>
                        <h1>Buscar Trabajo</h1>
                        <p>Trabajos disponibles en tu área de especialización</p>
                    </div>
                )}
                {isTab && (
                    <div className="tab-header">
                        <h2>Buscar Trabajo</h2>
                        <p>Trabajos disponibles en tu área de especialización</p>
                    </div>
                )}
                <div className="loading-container">
                    <FaSpinner className="spinner" />
                    <p>Cargando trabajos disponibles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={isTab ? "buscar-trabajo-tab" : "buscar-trabajo-container"}>
                {!isTab && (
                    <div className="buscar-trabajo-header">
                        <button 
                            className="back-button"
                            onClick={() => navigate('/main')}
                        >
                            <FaArrowLeft />
                            Volver al Dashboard
                        </button>
                        <h1>Buscar Trabajo</h1>
                        <p>Trabajos disponibles en tu área de especialización</p>
                    </div>
                )}
                {isTab && (
                    <div className="tab-header">
                        <h2>Buscar Trabajo</h2>
                        <p>Trabajos disponibles en tu área de especialización</p>
                    </div>
                )}
                <div className="error-container">
                    <h2>Error al cargar trabajos</h2>
                    <p>{error}</p>
                    <button onClick={fetchSolicitudesDisponibles} className="retry-button">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={isTab ? "buscar-trabajo-tab" : "buscar-trabajo-container"}>
            {/* Header */}
            {!isTab && (
                <div className="buscar-trabajo-header">
                    <button 
                        className="back-button"
                        onClick={() => navigate('/main')}
                    >
                        <FaArrowLeft />
                        Volver al Dashboard
                    </button>
                    <h1>Buscar Trabajo</h1>
                    <p>Trabajos disponibles en tu área de especialización</p>
                </div>
            )}
            {isTab && (
                <div className="tab-header">
                    <h2>Buscar Trabajo</h2>
                    <p>Trabajos disponibles en tu área de especialización</p>
                </div>
            )}

            {/* Lista de solicitudes */}
            <div className="solicitudes-list">
                {solicitudes.length === 0 ? (
                    <div className="no-solicitudes">
                        <FaHandshake className="no-solicitudes-icon" />
                        <h3>No hay trabajos disponibles</h3>
                        <p>No se encontraron solicitudes que coincidan con tu especialización y ubicación.</p>
                    </div>
                ) : (
                    solicitudes.map((solicitud) => (
                        <div key={solicitud.id} className="solicitud-card">
                            <div className="solicitud-header">
                                <h3 className="solicitud-titulo">{solicitud.titulo}</h3>
                                <div className="solicitud-prioridad" style={{ color: getPrioridadColor(solicitud.prioridad) }}>
                                    {getPrioridadIcon(solicitud.prioridad)}
                                    <span>{solicitud.prioridad.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="solicitud-info">
                                <div className="info-item">
                                    <FaMapMarkerAlt className="info-icon" />
                                    <span>{solicitud.direccion}</span>
                                </div>
                                <div className="info-item">
                                    <FaCalendarAlt className="info-icon" />
                                    <span>{formatFecha(solicitud.creado_en)}</span>
                                </div>
                                <div className="info-item">
                                    <FaUser className="info-icon" />
                                    <span>{solicitud.cliente_nombre || 'Cliente'}</span>
                                </div>
                            </div>

                            <div className="solicitud-descripcion">
                                <p>{solicitud.descripcion}</p>
                            </div>

                            <div className="solicitud-actions">
                                <button 
                                    className="ver-detalle-button"
                                    onClick={() => handleVerDetalle(solicitud)}
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
            {showModal && selectedSolicitud && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalles del Trabajo</h2>
                            <button 
                                className="close-button"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detalle-section">
                                <h3>{selectedSolicitud.solicitud.titulo}</h3>
                                <div className="detalle-prioridad" style={{ color: getPrioridadColor(selectedSolicitud.solicitud.prioridad) }}>
                                    {getPrioridadIcon(selectedSolicitud.solicitud.prioridad)}
                                    <span>Prioridad: {selectedSolicitud.solicitud.prioridad.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Descripción</h4>
                                <p className="descripcion-text">{selectedSolicitud.solicitud.descripcion}</p>
                            </div>

                            <div className="detalle-section">
                                <h4>Ubicación</h4>
                                <div className="ubicacion-info">
                                    <FaMapMarkerAlt className="info-icon" />
                                    <span>{selectedSolicitud.solicitud.direccion}</span>
                                </div>
                            </div>

                            <div className="detalle-section">
                                <h4>Información del Cliente</h4>
                                <div className="cliente-info">
                                    <div className="info-item">
                                        <FaUser className="info-icon" />
                                        <span>{selectedSolicitud.solicitud.cliente_nombre || 'Cliente'}</span>
                                    </div>
                                    <div className="info-item">
                                        <FaEnvelope className="info-icon" />
                                        <span>{selectedSolicitud.solicitud.cliente_email || 'No disponible'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedSolicitud.solicitud.foto && (
                                <div className="detalle-section">
                                    <h4>Foto del Problema</h4>
                                    <img 
                                        src={`http://localhost:3002${selectedSolicitud.solicitud.foto}`}
                                        alt="Foto del problema"
                                        className="problema-foto"
                                    />
                                </div>
                            )}

                            <div className="detalle-section">
                                <h4>Historial</h4>
                                <div className="historial-list">
                                    {selectedSolicitud.historial && selectedSolicitud.historial.length > 0 ? (
                                        selectedSolicitud.historial.map((item, index) => (
                                            <div key={index} className="historial-item">
                                                <div className="historial-fecha">
                                                    {formatFecha(item.fecha_creacion)}
                                                </div>
                                                <div className="historial-estado">
                                                    Estado: {item.estado_nombre}
                                                </div>
                                                {item.notas && (
                                                    <div className="historial-notas">
                                                        {item.notas}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="historial-item">
                                            <div className="historial-fecha">
                                                {formatFecha(selectedSolicitud.solicitud.creado_en)}
                                            </div>
                                            <div className="historial-estado">
                                                Estado: {selectedSolicitud.solicitud.estado_nombre || 'Abierta'}
                                            </div>
                                            <div className="historial-notas">
                                                Solicitud creada
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="cancel-button"
                                onClick={() => setShowModal(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="aplicar-button"
                                onClick={() => handleAplicarTrabajo(selectedSolicitud.solicitud.id)}
                            >
                                <FaHandshake />
                                Aplicar a este Trabajo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuscarTrabajo;
