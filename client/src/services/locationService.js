// client/src/services/locationService.js
import api from './api';

export const fetchProvincias = () =>
  api.get('/location/provincias');

export const fetchLocalidades = provinciaId =>
  api.get(`/location/localidades/${provinciaId}`);

export const fetchTiposProfesional = () =>
  api.get('/location/tipos-profesional');
