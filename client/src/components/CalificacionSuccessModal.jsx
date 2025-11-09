import React from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import './CalificacionSuccessModal.css';

const CalificacionSuccessModal = ({ 
    isOpen, 
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="calificacion-success-modal-overlay" onClick={onClose}>
            <div className="calificacion-success-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="calificacion-success-modal-header">
                    <button 
                        className="calificacion-success-close-button"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="calificacion-success-modal-body">
                    <div className="calificacion-success-icon-container">
                        <div className="calificacion-success-icon">
                            <FaCheckCircle />
                        </div>
                    </div>
                    
                    <h2 className="calificacion-success-title">¡Calificación enviada exitosamente!</h2>
                    <p className="calificacion-success-message">
                        Gracias por tu calificación. Tu opinión es muy importante para nosotros.
                    </p>
                    
                    <button
                        className="calificacion-success-button"
                        onClick={onClose}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalificacionSuccessModal;

