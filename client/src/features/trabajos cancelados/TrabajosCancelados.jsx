import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../trabajos asignados/trabajoasginado.css';
import {
    FaArrowLeft,
    FaMapMarkerAlt,
    FaClock,
    FaUser,
    FaCalendarAlt,
    FaSpinner,
    FaEye,
    FaDollarSign,
    FaTimesCircle,
    FaFilter
} from 'react-icons/fa';

const TrabajosCancelados = ({ isTab = false }) => {
    const navigate = useNavigate();
    const [ordenesCanceladas, setOrdenesCanceladas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrden, setSelectedOrden] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const [personaId, setPersonaId] = useState(null);
    const [filtros, setFiltros] = useState({
        cliente: '',
        dias: '',
        estado: ''
    });
    const [showFiltros, setShowFiltros] = useState(false);
    const [ordenesFiltradas, setOrdenesFiltradas] = useState([]);

    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                setUserData(JSON.parse(storedUserData));
            } catch (parseError) {
                console.error('Error al parsear userData:', parseError);
            }
        }
    }, []);

    useEffect(() => {
        const fetchPersonaId = async () => {
            if (userData?.id) {
                try {
                    const response = await fetch(`http://localhost:3002/api/auth/persona/${userData.id}`);
                    const data = await response.json();

                    if (data.success && data.data) {
                        setPersonaId(data.data.id);
                    }
                } catch (fetchError) {
                    console.error('Error al obtener persona_id:', fetchError);
                }
            }
        };

        fetchPersonaId();
    }, [userData]);

    useEffect(() => {
        if (personaId) {
            fetchOrdenesCanceladas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personaId]);

    useEffect(() => {
        if (ordenesCanceladas.length > 0) {
            aplicarFiltros();
        } else {
            setOrdenesFiltradas([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros, ordenesCanceladas]);

    const fetchOrdenesCanceladas = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!personaId) {
                throw new Error('No se encontró el ID del profesional');
            }

            const response = await fetch(`http://localhost:3002/api/ordenes/profesional/${personaId}`);
            const data = await response.json();

            if (data.success) {
                const ordenes = data.data.filter(orden => orden.estado === 'cancelado');
                setOrdenesCanceladas(ordenes);
            } else {
                throw new Error(data.message || 'Error al obtener las órdenes canceladas');
            }
        } catch (fetchError) {
            console.error('Error al cargar órdenes canceladas:', fetchError);
            setError(fetchError.message);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        if (ordenesCanceladas.length === 0) {
            setOrdenesFiltradas([]);
            return;
        }

        let resultado = [...ordenesCanceladas];

        if (filtros.cliente && filtros.cliente.trim() !== '') {
            const nombreCliente = filtros.cliente.toLowerCase().trim();
            resultado = resultado.filter(orden =>
                orden.cliente_nombre &&
                orden.cliente_nombre.toLowerCase().includes(nombreCliente)
            );
        }

        if (filtros.estado && filtros.estado !== '') {
            resultado = resultado.filter(orden => orden.estado === filtros.estado);
        }

        if (filtros.dias && filtros.dias !== '') {
            const diasAtras = parseInt(filtros.dias, 10);
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
        return hora.substring(0, 5);
    };

    const renderHeader = () => {
        if (isTab) {
            return (
                <div className="tab-header">
                    <h2>Trabajos Cancelados</h2>
                    <p>Órdenes de trabajo que fueron canceladas</p>
                </div>
            );
        }

        return (
            <div className="trabajos-asignados-header">
                <button
                    className="back-button"
                    onClick={() => navigate('/main')}
                >
                    <FaArrowLeft />
                    Volver al Dashboard
                </button>
                <h1>Trabajos Cancelados</h1>
                <p>Órdenes de trabajo que fueron canceladas</p>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={isTab ? 'trabajos-asignados-tab' : 'trabajos-asignados-container'}>
                {renderHeader()}
                <div className="loading-container">
                    <FaSpinner className="spinner" />
                    <p>Cargando trabajos cancelados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={isTab ? 'trabajos-asignados-tab' : 'trabajos-asignados-container'}>
                {renderHeader()}
                <div className="error-container">
                    <h2>Error al cargar trabajos cancelados</h2>
                    <p>{error}</p>
                    <button onClick={fetchOrdenesCanceladas} className="retry-button">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={isTab ? 'trabajos-asignados-tab' : 'trabajos-asignados-container'}>
            {renderHeader()}

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
                            <label htmlFor="filtro-cliente-cancelados">Cliente:</label>
                            <input
                                type="text"
                                id="filtro-cliente-cancelados"
                                value={filtros.cliente}
                                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                                placeholder="Buscar por nombre de cliente"
                                className="filtro-input-text"
                            />
                        </div>

                        <div className="filtro-grupo">
                            <label htmlFor="filtro-dias-cancelados">Últimos días:</label>
                            <select
                                id="filtro-dias-cancelados"
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
                            <label htmlFor="filtro-estado-cancelados">Estado:</label>
                            <select
                                id="filtro-estado-cancelados"
                                value={filtros.estado}
                                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="cancelado">Cancelado</option>
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

            <div className="ordenes-list">
                {ordenesCanceladas.length === 0 ? (
                    <div className="no-ordenes">
                        <FaTimesCircle className="no-ordenes-icon" />
                        <h3>No tienes trabajos cancelados</h3>
                        <p>Aún no tienes órdenes de trabajo canceladas.</p>
                    </div>
                ) : ordenesFiltradas.length === 0 ? (
                    <div className="no-ordenes">
                        <FaTimesCircle className="no-ordenes-icon" />
                        <h3>No hay trabajos que coincidan con los filtros</h3>
                        <p>Intenta ajustar los filtros de búsqueda.</p>
                    </div>
                ) : (
                    ordenesFiltradas.map((orden) => (
                        <div key={orden.id} className="orden-card">
                            <div className="orden-header">
                                <h3 className="orden-titulo">{orden.solicitud_titulo}</h3>
                                <div className="orden-estado" style={{ color: '#ff4444' }}>
                                    <FaTimesCircle />
                                    <span>Cancelado</span>
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
                                <div className="detalle-estado" style={{ color: '#ff4444' }}>
                                    <FaTimesCircle />
                                    <span>Estado: Cancelado</span>
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

export default TrabajosCancelados;
