// src/components/ClienteFields.jsx
import React from 'react';

export default function ClienteFields({ formData, onChange, disabled = false }) {
  return (
    <>
      <div className='inputDiv'>
        <label htmlFor='direccion'>Dirección</label>
        <div className='input flex'>
          <input
            type='text'
            id='direccion'
            name='direccion'
            placeholder='Ingresa tu dirección'
            value={formData.direccion}
            onChange={onChange}
            required
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}
