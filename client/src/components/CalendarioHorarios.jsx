import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaClock, FaCheck } from 'react-icons/fa';
import './CalendarioHorarios.css';

const CalendarioHorarios = ({ 
    profesionalId, 
    duracion, 
    onHorarioSeleccionado, 
    onCerrar,
    ordenId = null,
    titulo = 'Seleccionar Horario',
    textoConfirmar = 'Confirmar Horario'
}) => {
    const [semanaActual, setSemanaActual] = useState(0); // 0 = semana actual, 1-3 = siguientes
    const [horariosDisponibles, setHorariosDisponibles] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

    const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    // Calcular fecha de inicio de la semana actual (lunes)
    const getFechaInicioSemana = (offsetSemanas = 0) => {
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1; // Ajustar para que Lunes sea 0
        
        const lunesActual = new Date(hoy);
        lunesActual.setDate(hoy.getDate() - diasHastaLunes);
        lunesActual.setHours(0, 0, 0, 0);
        
        // Agregar semanas usando milisegundos para evitar problemas con setDate
        const fechaInicio = new Date(lunesActual.getTime() + (offsetSemanas * 7 * 24 * 60 * 60 * 1000));
        
        return fechaInicio.toISOString().split('T')[0];
    };

    // Calcular fecha de fin de la semana (domingo)
    const getFechaFinSemana = (offsetSemanas = 0) => {
        const fechaInicio = new Date(getFechaInicioSemana(offsetSemanas));
        // Agregar 6 días usando milisegundos
        const fechaFin = new Date(fechaInicio.getTime() + (6 * 24 * 60 * 60 * 1000));
        return fechaFin.toISOString().split('T')[0];
    };

    // Formatear fecha para mostrar en el título (DD/MM/YYYY)
    const formatearFechaTitulo = (fechaISO) => {
        const fecha = new Date(fechaISO + 'T00:00:00');
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
    };

    // Cargar horarios disponibles para la semana actual
    const cargarHorarios = async (offsetSemanas) => {
        try {
            setLoading(true);
            setError('');
            
            const fechaInicio = getFechaInicioSemana(offsetSemanas);
            
            let url = `http://localhost:3002/api/horarios/profesional/${profesionalId}/disponibles?fechaInicio=${fechaInicio}&duracion=${duracion}`;
            if (ordenId) {
                url += `&ordenId=${ordenId}`;
            }

            const response = await fetch(url);
            
            const data = await response.json();
            
            if (data.success) {
                setHorariosDisponibles(data.data.horariosDisponibles);
            } else {
                setError(data.message || 'Error al cargar horarios');
            }
        } catch (err) {
            console.error('Error al cargar horarios:', err);
            setError('Error al cargar los horarios disponibles');
        } finally {
            setLoading(false);
        }
    };

    // Cargar horarios cuando cambia la semana
    useEffect(() => {
        cargarHorarios(semanaActual);
    }, [semanaActual, profesionalId, duracion, ordenId]);

    // Navegar a la semana anterior
    const semanaAnterior = () => {
        if (semanaActual > 0) {
            setSemanaActual(semanaActual - 1);
            setHorarioSeleccionado(null);
        }
    };

    // Navegar a la semana siguiente
    const semanaSiguiente = () => {
        if (semanaActual < 3) { // Máximo 4 semanas (0-3)
            setSemanaActual(semanaActual + 1);
            setHorarioSeleccionado(null);
        }
    };

    // Seleccionar horario
    const seleccionarHorario = (dia, horario) => {
        const fechaInicio = getFechaInicioSemana(semanaActual);
        const fechaInicioObj = new Date(fechaInicio + 'T00:00:00');
        const diaIndex = diasSemana.indexOf(dia);
        
        // Crear nueva fecha sumando días
        const fecha = new Date(fechaInicioObj);
        fecha.setUTCDate(fechaInicioObj.getUTCDate() + diaIndex);
        
        setHorarioSeleccionado({
            fecha: fecha.toISOString().split('T')[0],
            dia,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
        });
    };

    // Confirmar selección
    const confirmarSeleccion = () => {
        if (horarioSeleccionado) {
            onHorarioSeleccionado(horarioSeleccionado);
        }
    };

    // Formatear fecha para mostrar
    const formatearFecha = (dia) => {
        const fechaInicio = getFechaInicioSemana(semanaActual);
        const fechaInicioObj = new Date(fechaInicio + 'T00:00:00'); // Asegurar que es a medianoche
        const diaIndex = diasSemana.indexOf(dia);
        
        // Crear nueva fecha sumando días
        const fecha = new Date(fechaInicioObj);
        fecha.setUTCDate(fechaInicioObj.getUTCDate() + diaIndex);
        
        return fecha.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
        });
    };

    // Verificar si un día es pasado
    const esDiaPasado = (dia) => {
        const fechaInicio = getFechaInicioSemana(semanaActual);
        const fechaInicioObj = new Date(fechaInicio + 'T00:00:00');
        const diaIndex = diasSemana.indexOf(dia);
        
        // Crear nueva fecha sumando días
        const fecha = new Date(fechaInicioObj);
        fecha.setUTCDate(fechaInicioObj.getUTCDate() + diaIndex);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        return fecha < hoy;
    };

    return (
        <div className="calendario-horarios-overlay">
            <div className="calendario-horarios-modal">
                <div className="calendario-header">
                    <h2>{titulo}</h2>
                    <button className="cerrar-calendario" onClick={onCerrar}>
                        ×
                    </button>
                </div>

                <div className="calendario-navegacion">
                    <div className="nav-left">
                        {semanaActual > 0 && (
                            <button 
                                className="nav-button" 
                                onClick={semanaAnterior}
                            >
                                <FaChevronLeft />
                            </button>
                        )}
                    </div>
                    
                    <div className="semana-info">
                        <span>
                            {semanaActual === 0 ? 'Esta semana:' : 
                             semanaActual === 1 ? 'Próxima semana:' :
                             `Semana ${semanaActual + 1}:`}
                        </span>
                        <small>
                            {formatearFechaTitulo(getFechaInicioSemana(semanaActual))} - {formatearFechaTitulo(getFechaFinSemana(semanaActual))}
                        </small>
                    </div>
                    
                    <div className="nav-right">
                        {semanaActual < 3 && (
                            <button 
                                className="nav-button" 
                                onClick={semanaSiguiente}
                            >
                                <FaChevronRight />
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="calendario-loading">
                        <div className="loading-spinner" />
                        <p>Cargando horarios disponibles...</p>
                    </div>
                )}

                {error && (
                    <div className="calendario-error">
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <div className="calendario-grid">
                        {diasSemana.map(dia => {
                            const diaInfo = horariosDisponibles[dia];
                            const esPasado = esDiaPasado(dia);
                            
                            return (
                                <div key={dia} className={`calendario-dia ${esPasado ? 'dia-pasado' : ''}`}>
                                    <div className="dia-header">
                                        <h4>{dia}</h4>
                                        <span className="dia-fecha">{formatearFecha(dia)}</span>
                                    </div>
                                    
                                    <div className="horarios-container">
                                        {esPasado ? (
                                            <div className="dia-no-disponible">
                                                <FaClock />
                                                <span>Día pasado</span>
                                            </div>
                                        ) : !diaInfo || diaInfo.horarios.length === 0 ? (
                                            <div className="dia-no-disponible">
                                                <FaClock />
                                                <span>Sin horarios</span>
                                            </div>
                                        ) : (
                                            diaInfo.horarios.map((horario, index) => {
                                                const estaSeleccionado = horarioSeleccionado && 
                                                    horarioSeleccionado.dia === dia &&
                                                    horarioSeleccionado.horaInicio === horario.horaInicio;
                                                
                                                return (
                                                    <button
                                                        key={index}
                                                        className={`horario-slot ${estaSeleccionado ? 'seleccionado' : ''}`}
                                                        onClick={() => seleccionarHorario(dia, horario)}
                                                        disabled={!horario.disponible}
                                                    >
                                                        <FaClock />
                                                        <span>{horario.horaInicio} - {horario.horaFin}</span>
                                                        {estaSeleccionado && <FaCheck className="check-icon" />}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {horarioSeleccionado && (
                    <div className="calendario-footer">
                        <div className="seleccion-info">
                            <h4>Horario seleccionado:</h4>
                            <p>
                                {horarioSeleccionado.dia} {formatearFecha(horarioSeleccionado.dia)} - 
                                {horarioSeleccionado.horaInicio} a {horarioSeleccionado.horaFin}
                            </p>
                        </div>
                        <div className="calendario-acciones">
                            <button className="cancelar-button" onClick={onCerrar}>
                                Cancelar
                            </button>
                            <button className="confirmar-button" onClick={confirmarSeleccion}>
                                {textoConfirmar}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarioHorarios;
