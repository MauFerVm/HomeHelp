import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Propiedades:
 *  - allowedRoles  (string[]) opcional – si se pasa, sólo los roles listados
 *                  pueden acceder; el resto es redirigido a "/main".
 *  - children      (ReactNode) opcional – si se pasa se renderiza en lugar de
 *                  <Outlet />, útil para envolver una ruta individual sin Layout.
 *
 * Flujo:
 *  1. No autenticado   → redirige a "/" (pantalla de login)
 *  2. Rol no permitido → redirige a "/main" (inicio del panel)
 *  3. OK               → renderiza <Outlet /> o children
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
    const { isAuthenticated, userType } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userType)) {
        return <Navigate to="/main" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;

