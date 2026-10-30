import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Helpers para leer el estado inicial de localStorage de forma segura
// ---------------------------------------------------------------------------
const readUserData = () => {
    try {
        const raw = localStorage.getItem('userData');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Validación mínima: necesita al menos un id
        return parsed && parsed.id ? parsed : null;
    } catch {
        return null;
    }
};

const readUserType = () => localStorage.getItem('userType') || null;

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------
const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => readUserData());
    const [userType, setUserType] = useState(() => readUserType());

    /** `isAuthenticated` es true si existe un objeto de usuario válido */
    const isAuthenticated = Boolean(user);

    /**
     * login(userData)
     * Persiste la información en localStorage y actualiza el estado reactivo.
     * No recibe un token separado porque el backend ya lo devuelve embebido en `userData`.
     */
    const login = useCallback((userData) => {
        const rol = userData?.rol || 'cliente';
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userType', rol);
        setUser(userData);
        setUserType(rol);
    }, []);

    /**
     * logout()
     * Limpia el estado, vacía las claves de autenticación en localStorage y
     * redirige a la raíz ("/").
     */
    const logout = useCallback(() => {
        localStorage.removeItem('userData');
        localStorage.removeItem('userType');
        setUser(null);
        setUserType(null);
        navigate('/', { replace: true });
    }, [navigate]);

    /**
     * updateUser(partialData)
     * Fusiona cambios parciales del perfil en el estado y en localStorage
     * (ej.: foto_perfil, nombre, etc.)
     */
    const updateUser = useCallback((partialData) => {
        setUser(prev => {
            const merged = { ...prev, ...partialData };
            localStorage.setItem('userData', JSON.stringify(merged));
            return merged;
        });
    }, []);

    const value = {
        user,
        userType,
        isAuthenticated,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook personalizado
// ---------------------------------------------------------------------------
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    }
    return ctx;
};

export default AuthContext;

