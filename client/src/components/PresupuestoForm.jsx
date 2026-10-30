import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheck, FaTimes, FaSpinner, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import SuccessModal from './SuccessModal';
import { minutosToHHMM } from '../utils/timeUtils';
import './PresupuestoForm.css';

const DURACION_PASO = 30;
const DURACION_MIN = 30;
const DURACION_MAX = 24 * 60;
const DURACION_INICIAL = 60;

const PresupuestoForm = ({
    solicitud,
    onClose,
    onSubmit
}) => {
    const [formData, setFormData] = useState({
        monto: '',
        descripcion: '',
        duracion: DURACION_INICIAL
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { user } = useAuth();
    const stepperRef = useRef(null);
    const cambiarDuracionRef = useRef(() => { });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error cuando el usuario empiece a escribir
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        // Convertir el monto formateado a número puro para validar
        const montoSinFormato = formData.monto
            .replace(/[^\d.,]/g, '') // Remover símbolo de peso y espacios
            .replace(/\./g, '') // Remover puntos (separadores de miles)
            .replace(',', '.'); // Convertir coma a punto para decimales

        if (!formData.monto || parseFloat(montoSinFormato) <= 0) {
            setError('El monto debe ser mayor a 0');
            return;
        }

        if (!formData.descripcion.trim()) {
            setError('La descripción es obligatoria');
            return;
        }

        if (!formData.duracion || formData.duracion < DURACION_MIN) {
            setError('La duración mínima es de 30 minutos');
            return;
        }

        try {
            setLoading(true);
            setError('');

            if (!user?.id) {
                throw new Error('No se encontraron datos del usuario');
            }

            // Preparar datos para enviar
            // Convertir el monto formateado a número puro
            const montoSinFormato = formData.monto
                .replace(/[^\d.,]/g, '') // Remover símbolo de peso y espacios
                .replace(/\./g, '') // Remover puntos (separadores de miles)
                .replace(',', '.'); // Convertir coma a punto para decimales

            const presupuestoData = {
                solicitud_id: solicitud.id,
                profesional_persona_id: user.id, // Asumiendo que el ID del usuario corresponde al ID de la persona
                monto: parseFloat(montoSinFormato),
                descripcion: formData.descripcion.trim(),
                duracion: formData.duracion,
                estado: 'enviado'
            };

            // Llamar a la función onSubmit que viene del componente padre
            await onSubmit(presupuestoData);

            // Si llegamos aquí, el envío fue exitoso
            setLoading(false);
            handleShowSuccessModal();

        } catch (error) {
            console.error('Error al enviar presupuesto:', error);
            setError(error.message || 'Error al enviar el presupuesto');
            setLoading(false);
            return; // Salir si hay error
        }
    };

    const formatMonto = (value) => {
        // Remover solo el símbolo de peso y espacios, mantener números, puntos y comas
        const cleaned = value.replace(/[^\d.,]/g, '');

        // Si está vacío, retornar vacío
        if (cleaned === '') return '';

        // Separar parte entera y decimal
        let integerPart = '';
        let decimalPart = '';

        // Si hay coma, separar en parte entera y decimal
        if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            integerPart = parts[0];
            decimalPart = parts[1] || '';
        } else {
            integerPart = cleaned;
        }

        // Remover puntos de la parte entera (son separadores de miles que el usuario puede haber puesto)
        integerPart = integerPart.replace(/\./g, '');

        // Validar que la parte entera sea solo números
        if (!/^\d*$/.test(integerPart)) return '';

        // Si no hay parte entera, retornar vacío
        if (integerPart === '') return '';

        // Convertir a número para formatear
        const num = parseFloat(integerPart + (decimalPart ? '.' + decimalPart : ''));
        if (isNaN(num)) return '';

        // Formatear con separadores de miles
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Construir el resultado
        let result = `$ ${formattedInteger}`;
        if (decimalPart) {
            result += `,${decimalPart}`;
        }

        return result;
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        // Limpiar el estado del formulario
        setFormData({ monto: '', descripcion: '', duracion: DURACION_INICIAL });
        setError('');
        // Cerrar el modal de presupuesto
        onClose();
    };

    const cambiarDuracion = (delta) => {
        if (loading) return;
        setFormData(prev => {
            const actual = typeof prev.duracion === 'number' ? prev.duracion : DURACION_MIN;
            const siguiente = Math.min(DURACION_MAX, Math.max(DURACION_MIN, actual + delta));
            return { ...prev, duracion: siguiente };
        });
        if (error) setError('');
    };

    cambiarDuracionRef.current = cambiarDuracion;

    useEffect(() => {
        const el = stepperRef.current;
        if (!el) return;

        let acumulado = 0;
        let touchY = null;

        const onWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            acumulado += e.deltaY;
            if (Math.abs(acumulado) < 40) return;
            const delta = acumulado > 0 ? -DURACION_PASO : DURACION_PASO;
            acumulado = 0;
            cambiarDuracionRef.current(delta);
        };

        const onTouchStart = (e) => {
            touchY = e.touches[0].clientY;
        };

        const onTouchMove = (e) => {
            if (touchY == null) return;
            const dy = touchY - e.touches[0].clientY;
            if (Math.abs(dy) < 28) return;
            e.preventDefault();
            cambiarDuracionRef.current(dy > 0 ? DURACION_PASO : -DURACION_PASO);
            touchY = e.touches[0].clientY;
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    const handleDuracionKeyDown = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault();
            cambiarDuracion(DURACION_PASO);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            cambiarDuracion(-DURACION_PASO);
        }
    };

    // Función para mostrar el modal de éxito
    const handleShowSuccessModal = () => {
        console.log('Mostrando modal de éxito - showSuccessModal será true');
        setShowSuccessModal(true);
        console.log('showSuccessModal establecido a true');

        // Cerrar automáticamente después de 3 segundos
        setTimeout(() => {
            console.log('Cerrando modal de éxito automáticamente después de 3 segundos');
            handleSuccessModalClose();
        }, 3000);
    };

    return (
        <>
            <div className="presupuesto-form-overlay" onClick={onClose}>
                <div className="presupuesto-form-container" onClick={(e) => e.stopPropagation()}>
                    <div className="presupuesto-form-header">
                        <h2>Enviar Presupuesto</h2>
                        <button
                            className="close-button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="presupuesto-form-body">
                        {/* Información de la solicitud */}
                        <div className="solicitud-info-section">
                            <h3>{solicitud.titulo}</h3>
                            <div className="solicitud-descripcion">
                                <p>{solicitud.descripcion}</p>
                            </div>
                        </div>

                        {/* Formulario de presupuesto */}
                        <form onSubmit={handleSubmit} className="presupuesto-form">
                            <div className="form-group monto-group">
                                <label htmlFor="monto" className="form-label">
                                    Monto del Presupuesto
                                </label>
                                <div className="monto-input-container">
                                    <input
                                        type="text"
                                        id="monto"
                                        name="monto"
                                        value={formData.monto}
                                        onChange={(e) => {
                                            const formatted = formatMonto(e.target.value);
                                            setFormData(prev => ({ ...prev, monto: formatted }));
                                        }}
                                        placeholder="$ 0.00"
                                        className="monto-input"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group duracion-group">
                                <label id="duracion-label" className="form-label">
                                    Duración Aproximada
                                </label>
                                <div
                                    ref={stepperRef}
                                    className={`duracion-stepper${loading ? ' is-disabled' : ''}`}
                                    role="spinbutton"
                                    tabIndex={loading ? -1 : 0}
                                    aria-labelledby="duracion-label"
                                    aria-valuemin={DURACION_MIN}
                                    aria-valuemax={DURACION_MAX}
                                    aria-valuenow={formData.duracion}
                                    aria-valuetext={minutosToHHMM(formData.duracion)}
                                    onKeyDown={handleDuracionKeyDown}
                                >
                                    <button
                                        type="button"
                                        className="duracion-step-btn"
                                        onClick={() => cambiarDuracion(-DURACION_PASO)}
                                        disabled={loading || formData.duracion <= DURACION_MIN}
                                        aria-label="Disminuir 30 minutos"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <span className="duracion-valor">{minutosToHHMM(formData.duracion)}</span>
                                    <button
                                        type="button"
                                        className="duracion-step-btn"
                                        onClick={() => cambiarDuracion(DURACION_PASO)}
                                        disabled={loading || formData.duracion >= DURACION_MAX}
                                        aria-label="Aumentar 30 minutos"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                                <small className="form-help-text">
                                    Ajusta con la rueda del mouse o deslizando, de a 30 minutos. Mínimo 30 minutos.
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="descripcion" className="form-label">
                                    Descripción del Trabajo
                                </label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                    placeholder="Describe detalladamente el trabajo que realizarás, materiales necesarios, tiempo estimado, etc."
                                    className="descripcion-textarea"
                                    rows="6"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    <FaTimes className="error-icon" />
                                    {error}
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    <FaTimes />
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="spinner" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck />
                                            Confirmar Presupuesto
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal de éxito - renderizado fuera del overlay del formulario */}
            {console.log('Renderizando SuccessModal, showSuccessModal:', showSuccessModal)}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleSuccessModalClose}
                title="¡Presupuesto Enviado Exitosamente!"
                message="Tu presupuesto ha sido enviado al cliente y será revisado."
                buttonText="Aceptar"
                showButton={false}
            />
        </>
    );
};

export default PresupuestoForm;
