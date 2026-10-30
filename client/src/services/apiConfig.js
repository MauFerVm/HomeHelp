/**
 * apiConfig.js
 * Fuente única de verdad para la URL base del backend.
 * Usa la variable de entorno VITE_API_BASE_URL (definida en client/.env)
 * con fallback a localhost:3002 para desarrollo local.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

/** URL base para llamadas a la API REST  →  http://host/api */
export const API_URL = `${API_BASE_URL}/api`;

/** URL base para recursos estáticos (imágenes de uploads)  →  http://host */
export const STATIC_URL = API_BASE_URL;

export default API_BASE_URL;

