import React from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import './PerfilGuardadoModal.css';

const PerfilGuardadoModal = ({ isOpen, changes = [], onClose }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="perfil-guardado-overlay" onClick={onClose}>
      <div className="perfil-guardado-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="perfil-guardado-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <FaTimes />
        </button>

        <div className="perfil-guardado-body">
          <div className="perfil-guardado-icon">
            <FaCheckCircle />
          </div>

          <h2 className="perfil-guardado-title">¡Se ha guardado correctamente!</h2>

          {changes.length > 0 ? (
            <div className="perfil-guardado-changes">
              <p className="perfil-guardado-subtitle">Cambios realizados:</p>
              <ul className="perfil-guardado-list">
                {changes.map((change, index) => (
                  <li key={`${change.field}-${index}`} className="perfil-guardado-item">
                    <span className="perfil-guardado-field">{change.field}</span>
                    {change.from && change.to ? (
                      <span className="perfil-guardado-values">
                        <span className="perfil-guardado-old">{change.from}</span>
                        <span className="perfil-guardado-arrow">→</span>
                        <span className="perfil-guardado-new">{change.to}</span>
                      </span>
                    ) : (
                      <span className="perfil-guardado-new">{change.to || change.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="perfil-guardado-message">Tus datos se guardaron sin modificaciones.</p>
          )}

          <button type="button" className="perfil-guardado-button" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PerfilGuardadoModal;
