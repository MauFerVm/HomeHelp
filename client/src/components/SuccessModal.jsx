import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import './SuccessModal.css';

const SuccessModal = ({ 
    isOpen, 
    onClose, 
    title = "¡Éxito!", 
    message = "Operación completada exitosamente",
    buttonText = "Aceptar",
    showButton = true
}) => {
    console.log('SuccessModal renderizado, isOpen:', isOpen);
    if (!isOpen) return null;

    return (
        <div className="success-modal-overlay" onClick={onClose}>
            <div className="success-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="success-modal-header">
                    <button 
                        className="close-button"
                        onClick={onClose}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="success-modal-body">
                    <div className="success-icon-container">
                        <div className="success-icon">
                            <FaCheck />
                        </div>
                    </div>
                    
                    <h2 className="success-title">{title}</h2>
                    <p className="success-message">{message}</p>
                    
                    {showButton && (
                        <button
                            className="success-button"
                            onClick={onClose}
                        >
                            {buttonText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
