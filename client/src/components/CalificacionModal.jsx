import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import './CalificacionModal.css';

const CalificacionModal = ({
    isOpen,
    onClose,
    solicitudId,
    calificadorPersonaId,
    calificadoPersonaId,
    calificadoNombre,
    onCalificacionEnviada
}) => {
    const [puntuacion, setPuntuacion] = useState(0);
    const [hoverPuntuacion, setHoverPuntuacion] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [yaCalificado, setYaCalificado] = useState(false);

    useEffect(() => {
        if (isOpen && solicitudId && calificadorPersonaId && calificadoPersonaId) {
            verificarCalificacion();
        }
    }, [isOpen, solicitudId, calificadorPersonaId, calificadoPersonaId]);

    const verificarCalificacion = async () => {
        try {
            const response = await fetch(
                `http://localhost:3002/api/calificaciones/verificar?solicitud_id=${solicitudId}&calificador_persona_id=${calificadorPersonaId}&calificado_persona_id=${calificadoPersonaId}`
            );
            const data = await response.json();
            
            if (data.success && data.data.existe) {
                setYaCalificado(true);
            } else {
                setYaCalificado(false);
            }
        } catch (error) {
            console.error('Error al verificar calificación:', error);
        }
    };

    const handleEnviar = async () => {
        if (puntuacion === 0) {
            setError('Por favor, selecciona una puntuación');
            return;
        }

        if (!solicitudId || !calificadorPersonaId || !calificadoPersonaId) {
            setError('Faltan datos necesarios para la calificación');
            return;
        }

        try {
            setEnviando(true);
            setError(null);

            const response = await fetch('http://localhost:3002/api/calificaciones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    solicitud_id: solicitudId,
                    calificador_persona_id: calificadorPersonaId,
                    calificado_persona_id: calificadoPersonaId,
                    puntuacion: puntuacion,
                    comentario: comentario.trim() || null
                })
            });

            const data = await response.json();

            if (data.success) {
                // Limpiar formulario
                setPuntuacion(0);
                setComentario('');
                setError(null);
                
                // Cerrar modal de calificación
                onClose();
                
                // Notificar al componente padre que la calificación se envió exitosamente
                // El padre se encargará de mostrar el modal de éxito
                if (onCalificacionEnviada) {
                    onCalificacionEnviada();
                }
            } else {
                setError(data.message || 'Error al enviar la calificación');
            }
        } catch (error) {
            console.error('Error al enviar calificación:', error);
            setError('Error al enviar la calificación. Por favor, intenta nuevamente.');
        } finally {
            setEnviando(false);
        }
    };

    const handleClose = () => {
        if (!enviando) {
            setPuntuacion(0);
            setComentario('');
            setError(null);
            setYaCalificado(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="calificacion-modal-overlay" onClick={handleClose}>
            <div className="calificacion-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="calificacion-modal-header">
                    <h2>Calificar {calificadoNombre || 'Usuario'}</h2>
                    <button 
                        className="calificacion-close-button"
                        onClick={handleClose}
                        disabled={enviando}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="calificacion-modal-body">
                    {yaCalificado ? (
                        <div className="ya-calificado-message">
                            <p>Ya has calificado a {calificadoNombre || 'este usuario'} para esta solicitud.</p>
                        </div>
                    ) : (
                        <>
                            <div className="calificacion-stars-container">
                                <p className="calificacion-label">¿Cómo calificarías el servicio?</p>
                                <div className="calificacion-stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FaStar
                                            key={star}
                                            className={`calificacion-star ${
                                                star <= (hoverPuntuacion || puntuacion) ? 'active' : ''
                                            }`}
                                            onMouseEnter={() => setHoverPuntuacion(star)}
                                            onMouseLeave={() => setHoverPuntuacion(0)}
                                            onClick={() => setPuntuacion(star)}
                                        />
                                    ))}
                                </div>
                                {puntuacion > 0 && (
                                    <p className="calificacion-puntuacion-text">
                                        {puntuacion === 1 && 'Muy malo'}
                                        {puntuacion === 2 && 'Malo'}
                                        {puntuacion === 3 && 'Regular'}
                                        {puntuacion === 4 && 'Bueno'}
                                        {puntuacion === 5 && 'Excelente'}
                                    </p>
                                )}
                            </div>

                            <div className="calificacion-comentario-container">
                                <label htmlFor="comentario" className="calificacion-label">
                                    Comentario (opcional)
                                </label>
                                <textarea
                                    id="comentario"
                                    className="calificacion-textarea"
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    placeholder="Escribe tu opinión sobre el servicio..."
                                    rows="4"
                                    maxLength="500"
                                />
                                <p className="calificacion-char-count">
                                    {comentario.length}/500 caracteres
                                </p>
                            </div>

                            {error && (
                                <div className="calificacion-error">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="calificacion-modal-footer">
                    {!yaCalificado && (
                        <button
                            className="calificacion-enviar-button"
                            onClick={handleEnviar}
                            disabled={enviando || puntuacion === 0}
                        >
                            {enviando ? 'Enviando...' : 'Enviar Calificación'}
                        </button>
                    )}
                    <button
                        className="calificacion-cancelar-button"
                        onClick={handleClose}
                        disabled={enviando}
                    >
                        {yaCalificado ? 'Cerrar' : 'Cancelar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalificacionModal;

