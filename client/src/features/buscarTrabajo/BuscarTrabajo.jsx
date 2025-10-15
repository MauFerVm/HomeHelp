import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BuscarTrabajo.css';
import PresupuestoForm from '../../components/PresupuestoForm';
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
    FaHandshake,
    FaFileInvoiceDollar
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
    const [showPresupuestoForm, setShowPresupuestoForm] = useState(false);
    const [userData, setUserData] = useState(null);
    const [presupuestosExistentes, setPresupuestosExistentes] = useState({});

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

    // Verificar presupuestos existentes cuando cambien las solicitudes o el usuario
    useEffect(() => {
        if (solicitudes.length > 0 && userData?.id) {
            verificarPresupuestosExistentes();
        }
    }, [solicitudes, userData]);

    const verificarPresupuestosExistentes = async () => {
        try {
            const verificaciones = solicitudes.map(async (solicitud) => {
                try {
                    const response = await fetch(`http://localhost:3002/api/presupuestos/verificar/${solicitud.id}/${userData.id}`);
                    const data = await response.json();
                    
                    if (data.success) {
                        return {
                            solicitudId: solicitud.id,
                            existe: data.data.existe,
                            presupuesto: data.data.presupuesto
                        };
                    }
                    return {
                        solicitudId: solicitud.id,
                        existe: false,
                        presupuesto: null
                    };
                } catch (error) {
                    console.error(`Error verificando presupuesto para solicitud ${solicitud.id}:`, error);
                    return {
                        solicitudId: solicitud.id,
                        existe: false,
                        presupuesto: null
                    };
                }
            });

            const resultados = await Promise.all(verificaciones);
            const presupuestosMap = {};
            
            resultados.forEach(resultado => {
                presupuestosMap[resultado.solicitudId] = {
                    existe: resultado.existe,
                    presupuesto: resultado.presupuesto
                };
            });

            setPresupuestosExistentes(presupuestosMap);
        } catch (error) {
            console.error('Error al verificar presupuestos existentes:', error);
        }
    };

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

    const handleAplicarTrabajo = () => {
        // Mostrar el formulario de presupuesto
        setShowPresupuestoForm(true);
        setShowModal(false);
    };

    const handleEnviarPresupuesto = async (presupuestoData) => {
        try {
            const response = await fetch('http://localhost:3002/api/presupuestos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(presupuestoData)
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar el estado de presupuestos existentes
                setPresupuestosExistentes(prev => ({
                    ...prev,
                    [presupuestoData.solicitud_id]: {
                        existe: true,
                        presupuesto: data.data
                    }
                }));
                
                // No recargar las solicitudes inmediatamente para permitir que se muestre el modal de éxito
                console.log('Presupuesto enviado exitosamente, no recargando solicitudes aún');
            } else {
                throw new Error(data.message || 'Error al enviar el presupuesto');
            }
        } catch (error) {
            console.error('Error al enviar presupuesto:', error);
            throw error; // Re-lanzar el error para que el componente PresupuestoForm lo maneje
        }
    };

    const handleCerrarPresupuestoForm = () => {
        setShowPresupuestoForm(false);
        setSelectedSolicitud(null);
        // Recargar las solicitudes cuando se cierre el formulario
        fetchSolicitudesDisponibles();
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
                                {presupuestosExistentes[solicitud.id]?.existe && (
                                    <div className="presupuestada-badge">
                                        <FaFileInvoiceDollar />
                                        <span>Presupuestada</span>
                                    </div>
                                )}
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
                            {presupuestosExistentes[selectedSolicitud?.solicitud?.id]?.existe ? (
                                <div className="presupuestada-info">
                                    <FaFileInvoiceDollar />
                                    <span>Ya has enviado un presupuesto para esta solicitud</span>
                                </div>
                            ) : (
                                <button 
                                    className="aplicar-button"
                                    onClick={handleAplicarTrabajo}
                                >
                                    <FaHandshake />
                                    Aplicar a este Trabajo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Formulario de Presupuesto */}
            {showPresupuestoForm && selectedSolicitud && (
                <PresupuestoForm
                    solicitud={selectedSolicitud.solicitud}
                    onClose={handleCerrarPresupuestoForm}
                    onSubmit={handleEnviarPresupuesto}
                />
            )}
        </div>
    );
};

export default BuscarTrabajo;
