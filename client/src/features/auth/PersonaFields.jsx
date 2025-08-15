// src/components/PersonaFields.jsx
import React from 'react';

export default function PersonaFields({ formData, onChange, disabled = false, maxBirthDate }) {
  const onInvalidName = (e) => e.target.setCustomValidity('Por favor ingrese su nombre y apellido.');
  const onInvalidBirth = (e) => e.target.setCustomValidity(`Debes ser mayor de 18 años (fecha igual o anterior a ${maxBirthDate}).`);
  const clearCustom = (e) => e.target.setCustomValidity('');

  return (
    <>
      <div className='inputDiv'>
        <label htmlFor='nombre_apellido'>Nombre y Apellido</label>
        <div className='input flex'>
          <input
            type='text'
            id='nombre_apellido'
            name='nombre_apellido'
            placeholder='Ingrese su nombre completo'
            value={formData.nombre_apellido}
            onChange={onChange}
            required
            disabled={disabled}
            onInvalid={onInvalidName}
            onInput={clearCustom}
          />
        </div>
      </div>

      <div className='inputDiv'>
        <label htmlFor='fecha_nacimiento'>Fecha de Nacimiento</label>
        <div className='input flex'>
          <input
            type='date'
            id='fecha_nacimiento'
            name='fecha_nacimiento'
            value={formData.fecha_nacimiento}
            onChange={onChange}
            required
            max={maxBirthDate}
            disabled={disabled}
            onInvalid={onInvalidBirth}
            onInput={clearCustom}
          />
        </div>
      </div>

      <div className='inputDiv'>
        <label htmlFor='foto_perfil'>Foto de Perfil (opcional)</label>
        <div className='input flex'>
          <input
            type='file'
            id='foto_perfil'
            name='foto_perfil'
            accept='image/*'
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}
