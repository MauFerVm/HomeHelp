// src/components/UsuarioFields.jsx
import React, { useState } from 'react';
import { MdEmail } from 'react-icons/md';
import { FaUserShield } from 'react-icons/fa';
import { BsFillShieldLockFill } from 'react-icons/bs';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export default function UsuarioFields({ formData, onChange, disabled = false, editMode = false }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <>
      <div className="inputDiv">
        <label htmlFor="correo">Correo Electrónico</label>
        <div className="input flex">
          <MdEmail className="icon" />
          <input
            type="email"
            id="correo"
            name="correo"
            placeholder="Ingrese su correo"
            value={formData.correo}
            onChange={onChange}
            required
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="inputDiv">
        <label htmlFor="nombre_usuario">Nombre de Usuario</label>
        <div className="input flex">
          <FaUserShield className="icon" />
          <input
            type="text"
            id="nombre_usuario"
            name="nombre_usuario"
            placeholder="Ingrese nombre de usuario"
            value={formData.nombre_usuario}
            onChange={onChange}
            required
            minLength={3}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="inputDiv">
        <label htmlFor="contrasena">Contraseña</label>
        <div className="input flex">
          <BsFillShieldLockFill className="icon" />
          <input
            type={showPassword ? "text" : "password"}
            id="contrasena"
            name="contrasena"
            placeholder={editMode ? 'Dejar en blanco para no cambiar' : 'Ingrese su contraseña'}
            value={formData.contrasena}
            onChange={onChange}
            required={!editMode}
            minLength={editMode ? undefined : 6}
            disabled={disabled}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '23px'
            }}
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </button>
        </div>
      </div>

    </>
  );
}
