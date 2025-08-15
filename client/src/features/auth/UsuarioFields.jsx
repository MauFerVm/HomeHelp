// src/components/UsuarioFields.jsx
import React from 'react';
import { MdEmail } from 'react-icons/md';
import { FaUserShield } from 'react-icons/fa';
import { BsFillShieldLockFill } from 'react-icons/bs';

export default function UsuarioFields({ formData, onChange, disabled = false }) {
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
          />
        </div>
      </div>

      <div className="inputDiv">
        <label htmlFor="contrasena">Contraseña</label>
        <div className="input flex">
          <BsFillShieldLockFill className="icon" />
          <input
            type="password"
            id="contrasena"
            name="contrasena"
            placeholder="Ingrese su contraseña"
            value={formData.contrasena}
            onChange={onChange}
            required
            minLength={6}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}
