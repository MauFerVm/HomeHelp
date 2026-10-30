import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import RegistroForm from '../features/auth/RegistroForm';
import HomeLayout from '../features/dashboard/HomeLayout';
import BuscarTrabajo from '../features/buscarTrabajo/BuscarTrabajo';
import TrabajosAsignados from '../features/trabajos asignados/trabajoasignado';

function AppRouter() {
  return (
    <Router>
      {/* AuthProvider va dentro de Router para que pueda usar useNavigate */}
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registro" element={<RegistroForm />} />

          {/* Rutas protegidas generales (cualquier usuario autenticado) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/main" element={<HomeLayout />} />
          </Route>

          {/* Rutas protegidas exclusivas para profesionales */}
          <Route element={<ProtectedRoute allowedRoles={['profesional']} />}>
            <Route path="/buscar-trabajo" element={<BuscarTrabajo />} />
            <Route path="/trabajos-asignados" element={<TrabajosAsignados />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default AppRouter;
