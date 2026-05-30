import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import api from '../services/api';
import UsuarioFields from '../features/auth/UsuarioFields';
import PerfilGuardadoModal from './PerfilGuardadoModal';
import './ModificarPerfilForm.css';

const truncateText = (text, max = 80) => {
  const value = String(text || '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
};

const getTipoNames = (ids, tiposList) =>
  ids
    .map(id => tiposList.find(t => String(t.id) === String(id))?.nombre)
    .filter(Boolean)
    .join(', ') || '—';

const getLocationName = (id, list) =>
  list.find(item => String(item.id) === String(id))?.nombre || '—';

const computeChanges = (initial, current, { provincias, localidades, tipos, userType }) => {
  const changes = [];

  if (initial.correo !== current.correo) {
    changes.push({ field: 'Correo electrónico', from: initial.correo, to: current.correo });
  }
  if (initial.nombre_usuario !== current.nombre_usuario) {
    changes.push({ field: 'Nombre de usuario', from: initial.nombre_usuario, to: current.nombre_usuario });
  }
  if (current.contrasena && current.contrasena.trim() !== '') {
    changes.push({ field: 'Contraseña', detail: 'Se actualizó la contraseña' });
  }
  if (current.foto_perfil) {
    changes.push({
      field: 'Foto de perfil',
      detail: `Nueva imagen: ${current.foto_perfil.name}`
    });
  }
  if (String(initial.provincia_id) !== String(current.provincia_id)) {
    changes.push({
      field: 'Provincia',
      from: initial.provincia_nombre || getLocationName(initial.provincia_id, provincias),
      to: getLocationName(current.provincia_id, provincias)
    });
  }
  if (String(initial.localidad_id) !== String(current.localidad_id)) {
    changes.push({
      field: 'Localidad',
      from: initial.localidad_nombre || getLocationName(initial.localidad_id, localidades),
      to: getLocationName(current.localidad_id, localidades)
    });
  }
  if (userType === 'profesional') {
    const initialTipos = [...initial.tipo_profesional_ids].map(String).sort();
    const currentTipos = [...current.tipo_profesional_ids].map(String).sort();
    if (JSON.stringify(initialTipos) !== JSON.stringify(currentTipos)) {
      changes.push({
        field: 'Tipos de profesional',
        from: getTipoNames(initial.tipo_profesional_ids, tipos),
        to: getTipoNames(current.tipo_profesional_ids, tipos)
      });
    }
    if (initial.presentacion !== current.presentacion) {
      changes.push({
        field: 'Presentación',
        from: truncateText(initial.presentacion),
        to: truncateText(current.presentacion)
      });
    }
  }

  return changes;
};

const ModificarPerfilForm = ({ isOpen, onClose, userType, usuarioId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedChanges, setSavedChanges] = useState([]);
  const updatedDataRef = useRef(null);
  const [formData, setFormData] = useState({
    correo: '',
    nombre_usuario: '',
    contrasena: '',
    foto_perfil: null,
    provincia_id: '',
    localidad_id: '',
    tipo_profesional_ids: [],
    presentacion: ''
  });

  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      setSavedChanges([]);
      updatedDataRef.current = null;
      return;
    }
    if (!usuarioId) return;

    const fetchData = async () => {
      setLoadingData(true);
      setError('');
      setShowSuccess(false);
      setSavedChanges([]);
      try {
        const endpoint = userType === 'profesional'
          ? `/auth/profesional/${usuarioId}`
          : `/auth/cliente/${usuarioId}`;

        const [profileRes, provinciasRes, tiposRes] = await Promise.all([
          api.get(endpoint),
          api.get('/location/provincias'),
          userType === 'profesional' ? api.get('/location/tipos-profesional') : Promise.resolve({ data: [] })
        ]);

        if (!profileRes.data?.success) {
          throw new Error(profileRes.data?.message || 'No se pudieron cargar los datos');
        }

        const data = profileRes.data.data;
        setProvincias(provinciasRes.data || []);
        if (userType === 'profesional') {
          setTipos(tiposRes.data || []);
        }

        const loadedFormData = {
          correo: data.correo || '',
          nombre_usuario: data.nombre_usuario || '',
          contrasena: '',
          foto_perfil: null,
          provincia_id: data.provincia_id ? String(data.provincia_id) : '',
          localidad_id: data.localidad_id ? String(data.localidad_id) : '',
          tipo_profesional_ids: (data.tipo_profesional_ids || []).map(String),
          presentacion: data.presentacion || ''
        };
        setFormData(loadedFormData);

        if (data.provincia_id) {
          const locRes = await api.get(`/location/localidades/${data.provincia_id}`);
          const loadedLocalidades = locRes.data || [];
          setLocalidades(loadedLocalidades);

          const provinciaNombre = (provinciasRes.data || []).find(
            p => String(p.id) === String(data.provincia_id)
          )?.nombre || '';
          const localidadNombre = loadedLocalidades.find(
            l => String(l.id) === String(data.localidad_id)
          )?.nombre || '';

          setInitialData({
            ...loadedFormData,
            provincia_nombre: provinciaNombre,
            localidad_nombre: localidadNombre
          });
        } else {
          setLocalidades([]);
          setInitialData(loadedFormData);
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err);
        setError(err.response?.data?.message || err.message || 'Error al cargar los datos del usuario');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, usuarioId, userType]);

  useEffect(() => {
    if (!formData.provincia_id) {
      setLocalidades([]);
      return;
    }
    api.get(`/location/localidades/${formData.provincia_id}`)
      .then(r => setLocalidades(r.data || []))
      .catch(() => setLocalidades([]));
  }, [formData.provincia_id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'provincia_id') {
      setFormData(prev => ({
        ...prev,
        provincia_id: value,
        localidad_id: ''
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const updateSelectedTipos = (next) => {
    setFormData(prev => ({ ...prev, tipo_profesional_ids: next }));
  };

  const handleAddTipo = (e) => {
    const id = e.target.value;
    if (!id || formData.tipo_profesional_ids.includes(id)) return;
    updateSelectedTipos([...formData.tipo_profesional_ids, id]);
    e.target.value = '';
  };

  const handleRemoveTipo = (tipoId) => {
    updateSelectedTipos(formData.tipo_profesional_ids.filter(v => v !== String(tipoId)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.localidad_id) {
      setError('Seleccioná una localidad');
      return;
    }

    if (userType === 'profesional' && formData.tipo_profesional_ids.length === 0) {
      setError('Seleccioná al menos un tipo de profesional');
      return;
    }

    if (userType === 'profesional' && !formData.presentacion.trim()) {
      setError('La presentación es obligatoria');
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('correo', formData.correo);
      payload.append('nombre_usuario', formData.nombre_usuario);
      payload.append('localidad_id', formData.localidad_id);

      if (formData.contrasena && formData.contrasena.trim() !== '') {
        payload.append('contrasena', formData.contrasena);
      }
      if (formData.foto_perfil) {
        payload.append('foto_perfil', formData.foto_perfil);
      }

      if (userType === 'profesional') {
        payload.append('presentacion', formData.presentacion);
        formData.tipo_profesional_ids.forEach(id => {
          payload.append('tipo_profesional_ids[]', id);
        });
      }

      const res = await fetch(`http://localhost:3002/api/auth/perfil/${usuarioId}`, {
        method: 'PUT',
        body: payload
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'No se pudo actualizar el perfil');
      }

      const changes = initialData
        ? computeChanges(initialData, formData, { provincias, localidades, tipos, userType })
        : [];

      updatedDataRef.current = json.data;
      setSavedChanges(changes);
      setShowSuccess(true);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    if (updatedDataRef.current) {
      onSuccess(updatedDataRef.current);
    }
    setShowSuccess(false);
    setSavedChanges([]);
    updatedDataRef.current = null;
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <PerfilGuardadoModal
        isOpen={showSuccess}
        changes={savedChanges}
        onClose={handleSuccessClose}
      />
    );
  }

  const availableTipos = tipos.filter(t => !formData.tipo_profesional_ids.includes(String(t.id)));

  const modalContent = (
    <div className="modal-overlay perfil-modal-overlay" onClick={onClose}>
      <div className="modal-content perfil-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header perfil-modal-header">
          <h2>Modificar datos de usuario</h2>
          <button type="button" className="close-button" onClick={onClose} disabled={loading}>
            <FaTimes />
          </button>
        </div>

        {loadingData ? (
          <div className="perfil-loading">
            <FaSpinner className="spinner" />
            <span>Cargando datos...</span>
          </div>
        ) : (
          <form className="perfil-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className="perfil-form-scroll">
              {error && <div className="perfil-error">{error}</div>}

              <div className="perfil-main-grid">
                {/* Columna izquierda: acceso + foto */}
                <div className="perfil-col perfil-col-left">
                  <section className="perfil-section">
                    <h3>Datos de acceso</h3>
                    <UsuarioFields formData={formData} onChange={handleChange} editMode />
                  </section>

                  <section className="perfil-section perfil-section-last">
                    <h3>Foto de perfil</h3>
                    <div className="inputDiv">
                      <label htmlFor="foto_perfil">Nueva foto (opcional)</label>
                      <input
                        type="file"
                        id="foto_perfil"
                        name="foto_perfil"
                        accept="image/*"
                        onChange={handleChange}
                      />
                    </div>
                  </section>
                </div>

                {/* Columna derecha: ubicación + perfil profesional */}
                <div className="perfil-col perfil-col-right">
                  <section className="perfil-section perfil-section-last">
                    <h3>{userType === 'profesional' ? 'Ubicación y perfil profesional' : 'Ubicación'}</h3>

                    <div className="inputDiv">
                      <label htmlFor="provincia_id">Provincia</label>
                      <select
                        id="provincia_id"
                        name="provincia_id"
                        value={formData.provincia_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccionar provincia</option>
                        {provincias.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="inputDiv">
                      <label htmlFor="localidad_id">Localidad</label>
                      <select
                        id="localidad_id"
                        name="localidad_id"
                        value={formData.localidad_id}
                        onChange={handleChange}
                        required
                        disabled={!formData.provincia_id}
                      >
                        <option value="">Seleccionar localidad</option>
                        {localidades.map(l => (
                          <option key={l.id} value={l.id}>{l.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {userType === 'profesional' && (
                      <>
                        <div className="inputDiv">
                          <label>Tipos de profesional</label>
                          {formData.tipo_profesional_ids.length > 0 && (
                            <ul className="perfil-tipos-list">
                              {formData.tipo_profesional_ids.map(id => {
                                const tipo = tipos.find(t => String(t.id) === String(id));
                                return (
                                  <li key={id} className="perfil-tipo-item">
                                    <span>{tipo?.nombre ?? 'Profesión'}</span>
                                    <button
                                      type="button"
                                      className="perfil-tipo-remove"
                                      onClick={() => handleRemoveTipo(id)}
                                    >
                                      Quitar
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {availableTipos.length > 0 && (
                            <select
                              className="perfil-tipo-add"
                              value=""
                              onChange={handleAddTipo}
                              aria-label="Agregar tipo de profesional"
                            >
                              <option value="">
                                {formData.tipo_profesional_ids.length === 0
                                  ? 'Seleccionar profesión'
                                  : 'Agregar otra profesión'}
                              </option>
                              {availableTipos.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="inputDiv">
                          <label htmlFor="presentacion">Presentación</label>
                          <textarea
                            id="presentacion"
                            name="presentacion"
                            placeholder="Contanos sobre vos"
                            value={formData.presentacion}
                            onChange={handleChange}
                            required
                            rows={5}
                          />
                        </div>
                      </>
                    )}
                  </section>
                </div>
              </div>
            </div>

            <div className="perfil-form-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <><FaSpinner className="spinner" /> Guardando...</> : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ModificarPerfilForm;
