import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './ConfirmModal.css';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm,
    title = "Confirmar acción", 
    message = "¿Estás seguro de que deseas realizar esta acción?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmButtonClass = "confirm-button",
    showIcon = true
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <button 
                        className="close-button"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="confirm-modal-body">
                    {showIcon && (
                        <div className="confirm-icon-container">
                            <div className="confirm-icon">
                                <FaExclamationTriangle />
                            </div>
                        </div>
                    )}
                    
                    <h2 className="confirm-title">{title}</h2>
                    <p className="confirm-message">{message}</p>
                    
                    <div className="confirm-button-group">
                        <button
                            className="cancel-button"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                        <button
                            className={confirmButtonClass}
                            onClick={handleConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;

