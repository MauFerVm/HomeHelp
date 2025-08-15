// src/components/ProfesionalFields.jsx
import React from 'react';

export default function ProfesionalFields({ formData, onChange, disabled = false, tipos = [] }) {
  return (
    <>
      <div className='inputDiv'>
        <label htmlFor='tipo_profesional_id'>Tipo de profesional</label>
        <select
          name='tipo_profesional_id'
          id='tipo_profesional_id'
          value={formData.tipo_profesional_id}
          onChange={onChange}
          required
          disabled={disabled}
        >
          <option value=''>Seleccionar tipo</option>
          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      <div className='inputDiv'>
        <label htmlFor='presentacion'>Presentación</label>
        <div className='input flex'>
          <textarea
            id='presentacion'
            name='presentacion'
            placeholder='Cuéntanos sobre vos'
            value={formData.presentacion}
            onChange={onChange}
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div className='inputDiv'>
        <label htmlFor='instituto'>Instituto (opcional)</label>
        <div className='input flex'>
          <input
            type='text'
            id='instituto'
            name='instituto'
            placeholder='Instituto donde estudiaste'
            value={formData.instituto}
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      </div>

      <div className='inputDiv'>
        <label htmlFor='foto_titulo'>Foto de Título (opcional)</label>
        <div className='input flex'>
          <input
            type='file'
            id='foto_titulo'
            name='foto_titulo'
            accept='image/*'
            onChange={onChange}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}
