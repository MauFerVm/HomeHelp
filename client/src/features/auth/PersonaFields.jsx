// src/components/PersonaFields.jsx
import React, { useState } from 'react';

export default function PersonaFields({ formData, onChange, disabled = false, maxBirthDate }) {
  const [ageError, setAgeError] = useState('');
  
  const onInvalidName = (e) => e.target.setCustomValidity('Por favor ingrese su nombre y apellido.');
  
  const onInvalidBirth = (e) => {
    const message = `Debes ser mayor de 18 años (fecha igual o anterior a ${maxBirthDate}).`;
    e.target.setCustomValidity(message);
    setAgeError(message);
    console.log('❌ Validación de edad fallida:', message);
  };
  
  const clearCustom = (e) => {
    e.target.setCustomValidity('');
    setAgeError('');
  };

  const validateAge = (birthDate) => {
    if (!birthDate) return;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age < 18) {
      const message = `❌Debes ser mayor de 18 años.`;
      setAgeError(message);
      console.log(message);
      return false;
    } else {
      setAgeError('');
      console.log(`✅ Validación de edad exitosa: ${age} años`);
      return true;
    }
  };

  const handleDateChange = (e) => {
    onChange(e);
    validateAge(e.target.value);
  };

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
            onChange={handleDateChange}
            required
            max={maxBirthDate}
            disabled={disabled}
            onInvalid={onInvalidBirth}
            onInput={clearCustom}
          />
        </div>
        {ageError && (
          <div style={{ 
            color: '#ff6b6b', 
            fontSize: '12px', 
            marginTop: '4px',
            fontWeight: '500'
          }}>
            {ageError}
          </div>
        )}
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
