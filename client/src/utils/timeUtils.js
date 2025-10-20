/**
 * Convierte minutos a formato HH:MM
 * @param {number} minutos - Número de minutos
 * @returns {string} Formato HH:MM
 */
export const minutosToHHMM = (minutos) => {
    if (!minutos || minutos < 0) return '00:00';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Convierte formato HH:MM a minutos
 * @param {string} tiempo - Formato HH:MM
 * @returns {number} Número de minutos
 */
export const HHMMToMinutos = (tiempo) => {
    if (!tiempo || typeof tiempo !== 'string') return 0;
    
    const [horas, minutos] = tiempo.split(':').map(Number);
    
    if (isNaN(horas) || isNaN(minutos)) return 0;
    
    return horas * 60 + minutos;
};

/**
 * Valida formato HH:MM
 * @param {string} tiempo - Formato HH:MM
 * @returns {boolean} True si es válido
 */
export const validarFormatoTiempo = (tiempo) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(tiempo);
};
