import React, { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaSpinner, FaCheck } from 'react-icons/fa';
import './PublicarProblemaForm.css';

const PublicarProblemaForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    tipoTrabajo: '',
    prioridad: 'media',
    titulo: '',
    descripcion: '',
    direccion: '',
    localidad_id: '',
    foto: null
  });

  const [tiposTrabajo, setTiposTrabajo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cargar tipos de trabajo al abrir el formulario
  useEffect(() => {
    if (isOpen) {
      fetchTiposTrabajo();
    }
  }, [isOpen]);

  const fetchTiposTrabajo = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('http://localhost:3002/api/solicitudes/tipos-trabajo');
      const data = await response.json();
      
      if (data.success) {
        setTiposTrabajo(data.data);
      } else {
        console.error('Error al cargar tipos de trabajo:', data.message);
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          foto: 'El archivo no puede ser mayor a 5MB'
        }));
        return;
      }
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          foto: 'Solo se permiten archivos de imagen (JPG, PNG, GIF)'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        foto: file
      }));
      
      // Limpiar error
      if (errors.foto) {
        setErrors(prev => ({
          ...prev,
          foto: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipoTrabajo) {
      newErrors.tipoTrabajo = 'Debe seleccionar un tipo de trabajo';
    }

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    } else if (formData.titulo.trim().length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    } else if (formData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es obligatoria';
    }

    if (!formData.localidad_id) {
      newErrors.localidad_id = 'Debe seleccionar una localidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Crear FormData para enviar archivos
      const submitData = new FormData();
      submitData.append('cliente_persona_id', 1); // TODO: Obtener del usuario logueado
      submitData.append('tipo_profesional_id', formData.tipoTrabajo);
      submitData.append('titulo', formData.titulo);
      submitData.append('descripcion', formData.descripcion);
      submitData.append('direccion', formData.direccion);
      submitData.append('localidad_id', formData.localidad_id);
      submitData.append('prioridad', formData.prioridad);
      
      if (formData.foto) {
        submitData.append('foto', formData.foto);
      }

      const response = await fetch('http://localhost:3002/api/solicitudes', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        // Limpiar formulario
        setFormData({
          tipoTrabajo: '',
          prioridad: 'media',
          titulo: '',
          descripcion: '',
          direccion: '',
          localidad_id: '',
          foto: null
        });
        
        // Mostrar modal de éxito
        setShowSuccessModal(true);
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setShowSuccessModal(false);
          onClose();
          onSubmit && onSubmit(data);
        }, 2000);
      } else {
        throw new Error(data.message || 'Error al crear la solicitud');
      }
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      alert('Error al crear la solicitud: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-content">
            <div className="success-icon">
              <FaCheck />
            </div>
            <h3>¡Solicitud creada exitosamente!</h3>
          </div>
        </div>
      )}

      <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Publicar un Problema</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="problema-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipoTrabajo">Tipo de Trabajo *</label>
              <select
                id="tipoTrabajo"
                name="tipoTrabajo"
                value={formData.tipoTrabajo}
                onChange={handleInputChange}
                className={errors.tipoTrabajo ? 'error' : ''}
                disabled={loadingData || loading}
              >
                <option value="">Seleccionar tipo de trabajo</option>
                {tiposTrabajo.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
              {errors.tipoTrabajo && <span className="error-message">{errors.tipoTrabajo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prioridad">Prioridad *</label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="titulo">Título del Problema *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ej: Fuga de agua en el baño"
              className={errors.titulo ? 'error' : ''}
              disabled={loading}
            />
            {errors.titulo && <span className="error-message">{errors.titulo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción Detallada *</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe el problema con el mayor detalle posible..."
              rows="4"
              className={errors.descripcion ? 'error' : ''}
              disabled={loading}
            />
            {errors.descripcion && <span className="error-message">{errors.descripcion}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección *</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Calle, número, piso, departamento..."
              className={errors.direccion ? 'error' : ''}
              disabled={loading}
            />
            {errors.direccion && <span className="error-message">{errors.direccion}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="localidad_id">Localidad *</label>
            <select
              id="localidad_id"
              name="localidad_id"
              value={formData.localidad_id}
              onChange={handleInputChange}
              className={errors.localidad_id ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Seleccionar localidad</option>
              {/* TODO: Cargar localidades desde la API */}
              <option value="1">Buenos Aires</option>
              <option value="2">Córdoba</option>
              <option value="3">Rosario</option>
            </select>
            {errors.localidad_id && <span className="error-message">{errors.localidad_id}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="foto">Foto del Problema (Opcional)</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="foto"
                name="foto"
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
                disabled={loading}
              />
              <label htmlFor="foto" className="file-upload-label">
                <FaUpload className="upload-icon" />
                <span>{formData.foto ? formData.foto.name : 'Seleccionar archivo'}</span>
              </label>
            </div>
            {errors.foto && <span className="error-message">{errors.foto}</span>}
            {formData.foto && (
              <div className="file-preview">
                <img 
                  src={URL.createObjectURL(formData.foto)} 
                  alt="Preview" 
                  className="preview-image"
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || loadingData}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Creando...
                </>
              ) : (
                'Publicar Problema'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default PublicarProblemaForm;
