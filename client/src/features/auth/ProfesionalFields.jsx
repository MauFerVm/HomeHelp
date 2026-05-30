// src/components/ProfesionalFields.jsx
import React from 'react';

export default function ProfesionalFields({ formData, onChange, disabled = false, tipos = [] }) {
  const selectedIds = formData.tipo_profesional_ids || [];

  const updateSelectedIds = (next) => {
    onChange({
      target: {
        name: 'tipo_profesional_ids',
        value: next
      }
    });
  };

  const handleAddTipo = (e) => {
    const id = e.target.value;
    if (!id || selectedIds.includes(id)) return;
    updateSelectedIds([...selectedIds, id]);
    e.target.value = '';
  };

  const handleRemoveTipo = (tipoId) => {
    updateSelectedIds(selectedIds.filter(v => v !== String(tipoId)));
  };

  const availableCount = tipos.filter(t => !selectedIds.includes(String(t.id))).length;
  const showAddCombo = availableCount > 0;

  return (
    <>
      <div className='inputDiv'>
        <label>Tipos de profesional</label>

        {selectedIds.length > 0 && (
          <ul className='tipos-profesional-seleccionados'>
            {selectedIds.map(id => {
              const tipo = tipos.find(t => String(t.id) === String(id));
              return (
                <li key={id} className='tipo-profesional-seleccionado'>
                  <span>{tipo?.nombre ?? 'Profesión'}</span>
                  <button
                    type='button'
                    className='tipo-profesional-quitar'
                    onClick={() => handleRemoveTipo(id)}
                    disabled={disabled}
                    aria-label={`Quitar ${tipo?.nombre ?? 'profesión'}`}
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {showAddCombo && (
          <select
            className='tipo-profesional-add'
            value=''
            onChange={handleAddTipo}
            disabled={disabled}
            aria-label='Agregar tipo de profesional'
          >
            <option value=''>
              {selectedIds.length === 0 ? 'Seleccionar profesión' : 'Agregar otra profesión'}
            </option>
            {tipos.map(t => {
              const isSelected = selectedIds.includes(String(t.id));
              return (
                <option key={t.id} value={t.id} disabled={isSelected}>
                  {t.nombre}{isSelected ? ' (ya seleccionada)' : ''}
                </option>
              );
            })}
          </select>
        )}

        {selectedIds.length === 0 && (
          <small>Seleccioná al menos un tipo de profesional</small>
        )}
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
