import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import RegistroForm from '../features/auth/RegistroForm';
import Dashboard from '../features/dashboard/dashboard';
import BuscarTrabajo from '../features/buscarTrabajo/BuscarTrabajo';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registro" element={<RegistroForm />} />
        <Route path="/main" element={<Dashboard />} />
        <Route path="/buscar-trabajo" element={<BuscarTrabajo />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;