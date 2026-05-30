// src/components/RegistroForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Register.css';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import video from '../../assets/video.mp4';
import logo from '../../assets/logo.png';

import UsuarioFields from './UsuarioFields';
import PersonaFields from './PersonaFields';
import ClienteFields from './ClienteFields';
import ProfesionalFields from './ProfesionalFields';

export default function RegistroForm() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState([]);

  // popup inicial de rol
  const [showRoleDialog, setShowRoleDialog] = useState(true);

  // modal para mensajes del servidor (error o success)
  const [serverModal, setServerModal] = useState({ show: false, title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState({
    correo: '',
    nombre_usuario: '',
    contrasena: '',
    nombre_apellido: '',
    fecha_nacimiento: '',
    foto_perfil: null,
    rol: '',
    direccion: '',
    provincia_id: '',
    localidad_id: '',
    tipo_profesional_ids: [],
    presentacion: '',
    instituto: '',
    foto_titulo: null
  });

  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [tipos, setTipos] = useState([]);

  const getMaxBirthDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0,10);
  };
  const maxBirthDate = getMaxBirthDate();

  useEffect(() => {
    api.get('/location/provincias').then(r => setProvincias(r.data)).catch(()=>setProvincias([]));
    api.get('/location/tipos-profesional').then(r => setTipos(r.data)).catch(()=>setTipos([]));
    setCaptchaText(generateCaptchaText());
  }, []);

  useEffect(() => {
    if (!formData.provincia_id) { setLocalidades([]); return; }
    api.get(`/location/localidades/${formData.provincia_id}`).then(r => setLocalidades(r.data)).catch(()=>setLocalidades([]));
  }, [formData.provincia_id]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSelectRole = (rol) => {
    setFormData(prev => ({ ...prev, rol }));
    setShowRoleDialog(false);
  };

  // Funciones del captcha
  const generateCaptchaText = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCaptchaChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCaptchaInput(value);
    const isVerified = value === captchaText;
    setCaptchaVerified(isVerified);
  };

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setCaptchaInput('');
    setCaptchaVerified(false);
  };

  const validateStep = () => {
    const container = formRef.current?.querySelector(`[data-step="${step}"]`);
    if (!container) return true;
    const controls = container.querySelectorAll('input, select, textarea');
    for (const el of controls) {
      if (el.disabled) continue;
      if (!el.checkValidity()) {
        // mostrar validación nativa
        el.reportValidity();
        el.focus();
        return false;
      }
    }

    // validaciones extra por paso
    if (step === 1) {
      if (!formData.fecha_nacimiento) { setErrors(['Fecha de nacimiento requerida']); return false; }
      const today = new Date();
      const born = new Date(formData.fecha_nacimiento);
      let age = today.getFullYear() - born.getFullYear();
      const m = today.getMonth() - born.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
      if (age < 18) { setErrors(['Debes ser mayor de 18 años']); return false; }
    }

    if (step === 2) {
      if (!formData.rol) { setErrors(['Rol no definido']); return false; }
      if (formData.rol === 'cliente' && !formData.direccion) { setErrors(['Dirección requerida']); return false; }
      if (formData.rol === 'profesional' && (!formData.tipo_profesional_ids || formData.tipo_profesional_ids.length === 0)) {
        setErrors(['Seleccioná al menos un tipo de profesional']);
        return false;
      }
      if (!captchaVerified) { setErrors(['El captcha es incorrecto o no fue completado']); return false; }
    }

    setErrors([]);
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(2, s + 1));
    // llevar top del step actual al inicio
    const stepEl = formRef.current?.querySelector(`[data-step="${Math.min(2, step + 1)}"]`);
    if (stepEl) stepEl.scrollTop = 0;
  };

  const handleBack = () => {
    setErrors([]);
    setStep(s => Math.max(0, s - 1));
    const stepEl = formRef.current?.querySelector(`[data-step="${Math.max(0, step - 1)}"]`);
    if (stepEl) stepEl.scrollTop = 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    // Construimos FormData explícitamente para asegurarnos que:
    // - el 'rol' siempre se envíe con la key 'rol'
    // - los archivos se envíen con las keys que espera el backend: 'foto_perfil' y 'foto_titulo'
    const payload = new FormData();

    // Campos escalares / string
    const scalarFields = [
      'correo','nombre_usuario','contrasena','nombre_apellido','fecha_nacimiento',
      'rol','direccion','provincia_id','localidad_id',
      'presentacion','instituto'
    ];
    scalarFields.forEach(k => {
      const v = formData[k];
      if (v !== null && v !== undefined && v !== '') {
        payload.append(k, v);
      }
    });

    if (formData.rol === 'profesional' && Array.isArray(formData.tipo_profesional_ids)) {
      formData.tipo_profesional_ids.forEach(id => {
        payload.append('tipo_profesional_ids', id);
      });
    }

    // Archivos
    if (formData.foto_perfil instanceof File) {
      payload.append('foto_perfil', formData.foto_perfil);
    }
    if (formData.foto_titulo instanceof File) {
      payload.append('foto_titulo', formData.foto_titulo);
    }

    try {
      // Nota: dejé la URL exactamente como la tenías (/auth/register-completo)
      // porque pediste que NO cambie otras cosas.
      await api.post('/auth/register-completo', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // mostrar modal de éxito y redirigir al cerrar
      setServerModal({
        show: true,
        title: 'Registro exitoso',
        message: 'Tu cuenta fue creada correctamente. Ahora podés iniciar sesión.',
        type: 'success'
      });

    } catch (err) {
      console.error('Error en register-completo:', err);
      const serverData = err?.response?.data;

      if (serverData && serverData.error) {
        if (serverData.error === 'username_taken') {
          setServerModal({ show: true, title: 'Usuario no disponible', message: serverData.message || 'Nombre de usuario no disponible. Elegí otro.', type: 'error' });
          setStep(0);
          setTimeout(() => { const el = document.getElementById('nombre_usuario'); if (el) el.focus(); }, 120);
          return;
        }
        if (serverData.error === 'email_taken') {
          setServerModal({ show: true, title: 'Correo existente', message: serverData.message || 'El correo ya está registrado. Iniciá sesión o usá otro correo.', type: 'error' });
          setStep(0);
          setTimeout(() => { const el = document.getElementById('correo'); if (el) el.focus(); }, 120);
          return;
        }
        setServerModal({ show: true, title: 'Error', message: serverData.message || 'No se pudo completar el registro.', type: 'error' });
        return;
      }

      setServerModal({ show: true, title: 'Error', message: 'Falló el registro. Intentá más tarde.', type: 'error' });
    }
  };

  const closeServerModal = () => {
    // si fue success redirigir a login
    if (serverModal.type === 'success') navigate('/');
    setServerModal({ show: false, title: '', message: '', type: 'info' });
  };

  const isFirstStep = step === 0;
  const isLastStep = step === 2;

  return (
    <div className='registerPage flex'>
      <div className='container flex'>
        <div className="videoDiv">
          <video src={video} autoPlay muted loop />
          <div className="textDiv">
            <h2 className='title'>Conecta con profesionales del hogar</h2>
            <p>Vive la tranquilidad del hogar</p>
          </div>

          {/* footerDiv con botón Login (restaurado) */}
          <div className='footerDiv flex' style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <span className='text'>¿Ya tenés cuenta?</span>
            <Link to='/'><button className='btn'>Login</button></Link>
          </div>
        </div>

        <div className='formDiv flex'>
          <div className='headerDiv'>
            <img src={logo} alt='Logo' />
            <h3>Regístrate</h3>
          </div>

          <form ref={formRef} className='form' onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* STEP 0 - Usuario */}
            <div className="step" data-step="0" style={{ display: step === 0 ? 'block' : 'none' }}>
              <UsuarioFields 
                formData={formData} 
                onChange={handleChange} 
                disabled={step !== 0}
              />
            </div>

            {/* STEP 1 - Persona */}
            <div className="step" data-step="1" style={{ display: step === 1 ? 'block' : 'none' }}>
              <PersonaFields formData={formData} onChange={handleChange} disabled={step !== 1} maxBirthDate={maxBirthDate} />
            </div>

            {/* STEP 2 - Ubicación y rol-specific */}
            <div className="step" data-step="2" style={{ display: step === 2 ? 'block' : 'none' }}>
              {!formData.rol && (
                <div style={{ marginBottom: '1rem' }}>
                  <label>Seleccione rol</label>
                  <div>
                    <button type="button" className="btn secondary" onClick={() => setFormData(prev => ({...prev, rol: 'cliente'}))}>Cliente</button>
                    <button type="button" className="btn secondary" onClick={() => setFormData(prev => ({...prev, rol: 'profesional'}))} style={{ marginLeft: 8 }}>Profesional</button>
                  </div>
                </div>
              )}

              <div className='inputDiv'>
                <label htmlFor='provincia_id'>Provincia</label>
                <select name='provincia_id' value={formData.provincia_id} onChange={handleChange} required disabled={step !== 2}>
                  <option value=''>Seleccionar provincia</option>
                  {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className='inputDiv'>
                <label htmlFor='localidad_id'>Localidad</label>
                <select name='localidad_id' value={formData.localidad_id} onChange={handleChange} required disabled={step !== 2 || !formData.provincia_id}>
                  <option value=''>Seleccionar localidad</option>
                  {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>

              {formData.rol === 'cliente' && <ClienteFields formData={formData} onChange={handleChange} disabled={step !== 2} />}
              {formData.rol === 'profesional' && <ProfesionalFields formData={formData} onChange={handleChange} disabled={step !== 2} tipos={tipos} />}

              {/* Captcha de letras */}
              <div className="captcha-container" style={{ marginTop: '20px' }}>
                <div style={{ 
                  background: '#f9f9f9',
                  border: `2px solid ${captchaVerified ? '#4caf50' : '#d3d3d3'}`,
                  borderRadius: '4px',
                  padding: '12px',
                  maxWidth: '240px',
                  margin: '0 auto'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#666',
                      fontWeight: 'bold'
                    }}>
                      Código:
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      disabled={step !== 2}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: '#4285f4',
                        textDecoration: 'underline'
                      }}
                    >
                      🔄
                    </button>
                  </div>
                  
                  {/* Imagen del captcha con letras distorsionadas */}
                  <div style={{
                    background: '#000',
                    color: '#fff',
                    padding: '8px',
                    marginBottom: '8px',
                    borderRadius: '3px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      letterSpacing: '4px',
                      fontFamily: 'monospace',
                      position: 'relative',
                      zIndex: 2,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      transform: 'rotate(-1deg)',
                      filter: 'contrast(1.2) brightness(1.1)'
                    }}>
                      {captchaText}
                    </div>
                    {/* Líneas de distorsión */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `
                        linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%),
                        linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)
                      `,
                      pointerEvents: 'none'
                    }} />
                  </div>

                  {/* Input para el captcha */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={handleCaptchaChange}
                      disabled={step !== 2}
                      placeholder="Código"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: `1px solid ${captchaVerified ? '#4caf50' : '#ddd'}`,
                        borderRadius: '3px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontFamily: 'monospace'
                      }}
                    />
                    {captchaVerified && (
                      <div style={{ 
                        color: '#4caf50',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>

                  {captchaVerified && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#4caf50',
                      textAlign: 'center',
                      marginTop: '6px',
                      fontWeight: 'bold'
                    }}>
                      ✓ Verificado
                    </div>
                  )}
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div style={{ color: 'var(--primaryColor)', margin: '1rem 0' }}>
                <ul>{errors.map(e => <li key={e}>{e}</li>)}</ul>
              </div>
            )}

            {/* NAV: siempre visible fuera del step scrollable */}
            <div className="wizardNav" style={{ marginTop: 12 }}>
              <div>
                {/* Mostrar solo si hay paso anterior */}
                {!isFirstStep && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleBack}
                  >
                    Anterior
                  </button>
                )}
              </div>

              <div>
                {!isLastStep ? (
                  <button type="button" className="btn primary" onClick={handleNext}>
                    Siguiente
                  </button>
                ) : (
                  <button type="submit" className="btn primary">
                    Registrar
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal del servidor (errores o éxito) */}
      {serverModal.show && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            width: '92%', maxWidth: 480, background: '#fff', padding: 20,
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', textAlign: 'center'
          }}>
            <h2>{serverModal.title}</h2>
            <p>{serverModal.message}</p>
            <div style={{ marginTop: 18 }}>
              <button onClick={closeServerModal} className='btn'>{serverModal.type === 'success' ? 'Ir a Login' : 'Cerrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup inicial para elegir rol (si aún está visible) */}
      {showRoleDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            width: '92%', maxWidth: 480, background: '#fff', padding: 20,
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', textAlign: 'center'
          }}>
            <h2>¿Cómo querés registrarte?</h2>
            <p>Seleccioná si te registrás como <strong>Cliente</strong> o <strong>Profesional</strong>.</p>
            <div style={{ marginTop: 18 }}>
              <button type="button" className="btn primary" onClick={() => handleSelectRole('cliente')} style={{ marginRight: 12 }}>Soy Cliente</button>
              <button type="button" className="btn secondary" onClick={() => handleSelectRole('profesional')}>Soy Profesional</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={() => handleSelectRole('cliente')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Cerrar (selecciona Cliente por defecto)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
