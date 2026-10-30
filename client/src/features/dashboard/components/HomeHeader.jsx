import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaUserEdit, FaSignOutAlt } from 'react-icons/fa';
import perfil from '../../../assets/user.png';
import './HomeHeader.css';

const HomeHeader = ({
    userType,
    userData,
    setActiveTab,
    onOpenModificarPerfil,
    onLogout
}) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const notiDropdownRef = useRef(null);
    const bellRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const profileWrapperRef = useRef(null);

    // Cargar notificaciones del usuario
    const fetchNotifications = async () => {
        const userDataRaw = localStorage.getItem('userData');
        if (!userDataRaw) return;
        try {
            const parsed = JSON.parse(userDataRaw);
            if (!parsed?.id) return;

            setLoadingNotifications(true);
            const res = await fetch(`http://localhost:3002/api/notificaciones/usuario/${parsed.id}`);
            const json = await res.json();
            if (json && json.success && Array.isArray(json.data)) {
                setNotifications(json.data);
                setUnreadCount(json.data.filter(n => Number(n.leido) === 0).length);
            } else {
                console.warn('Notificaciones: respuesta inesperada', json);
            }
        } catch (err) {
            console.error('Error fetchNotifications:', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const marcarComoLeida = async (notiId) => {
        try {
            const res = await fetch(`http://localhost:3002/api/notificaciones/${notiId}/leido`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();
            if (json && json.success !== false) {
                setNotifications(prev => prev.map(n => n.id === notiId ? { ...n, leido: 1 } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));

                const notificacion = notifications.find(n => n.id === notiId);
                if (notificacion) {
                    if (userType === 'cliente' && notificacion.tipo_notificacion === 'oferta') {
                        setActiveTab('mis-presupuestos');
                    } else if (notificacion.tipo_notificacion === 'sistema') {
                        setActiveTab(userType === 'profesional' ? 'trabajos-asignados' : 'mis-servicios');
                    } else if (userType === 'profesional' && notificacion.tipo_notificacion === 'solicitud') {
                        setActiveTab('buscar-trabajo');
                    }
                }
            } else {
                console.warn('No se pudo marcar notificacion como leida', json);
            }
        } catch (err) {
            console.error('Error marcarComoLeida:', err);
        }
    };

    const marcarTodasComoLeidas = async () => {
        const userDataRaw = localStorage.getItem('userData');
        if (!userDataRaw) return;
        try {
            const parsed = JSON.parse(userDataRaw);
            if (!parsed?.id) return;

            const res = await fetch(`http://localhost:3002/api/notificaciones/marcar-todas/${parsed.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();
            if (json && json.success !== false) {
                setNotifications(prev => prev.map(n => ({ ...n, leido: 1 })));
                setUnreadCount(0);
            } else {
                console.warn('No se pudieron marcar todas como leídas', json);
            }
        } catch (err) {
            console.error('Error marcarTodasComoLeidas:', err);
        }
    };

    const handleToggleProfileMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowNotifications(false);
        setShowProfileMenu(prev => !prev);
    };

    // Cargar notificaciones al montar
    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cerrar dropdowns si se hace clic fuera
    useEffect(() => {
        const onClickOutside = (e) => {
            const target = e.target;
            if (showNotifications) {
                if (
                    notiDropdownRef.current && !notiDropdownRef.current.contains(target) &&
                    bellRef.current && !bellRef.current.contains(target)
                ) {
                    setShowNotifications(false);
                }
            }
            if (showProfileMenu) {
                if (profileWrapperRef.current && !profileWrapperRef.current.contains(target)) {
                    setShowProfileMenu(false);
                }
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('touchstart', onClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('touchstart', onClickOutside);
        };
    }, [showNotifications, showProfileMenu]);

    // Clases en body para z-index en mobile
    useEffect(() => {
        if (showProfileMenu) {
            document.body.classList.add('profile-menu-open');
        } else {
            document.body.classList.remove('profile-menu-open');
        }
        return () => document.body.classList.remove('profile-menu-open');
    }, [showProfileMenu]);

    const fotoPerfilUrl = userData && userData.foto_perfil
        ? `http://localhost:3002/uploads/profiles/${userData.foto_perfil}`
        : perfil;

    return (
        <header className="dashboard-header">
            <div className="header-right">
                {/* Indicador del tipo de usuario */}
                <div className="user-type-indicator">
                    <span className="user-type-badge" data-user-type={userType}>
                        {userType === 'cliente' ? 'Cliente' :
                            userType === 'profesional' ? 'Profesional' : 'Administrador'}
                    </span>
                </div>

                {/* Ícono de notificaciones + dropdown */}
                <div className="notification-wrapper" style={{ position: 'relative' }}>
                    <div
                        className="notification-icon"
                        ref={bellRef}
                        onClick={() => {
                            const next = !showNotifications;
                            setShowProfileMenu(false);
                            setShowNotifications(next);
                            if (!showNotifications) fetchNotifications();
                        }}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        aria-label="Notificaciones"
                    >
                        <FaBell />
                        {unreadCount > 0 && (
                            <span
                                className="notification-badge"
                                style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    background: '#ff5a1f',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    padding: '2px 6px',
                                    fontSize: 12,
                                    fontWeight: 700
                                }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {showNotifications && (
                        <div
                            className="notifications-dropdown"
                            ref={notiDropdownRef}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 36,
                                width: 320,
                                maxHeight: 360,
                                overflowY: 'auto',
                                background: '#fff',
                                color: '#111',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                borderRadius: 8,
                                zIndex: 9999,
                                padding: 8
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                                <strong>Notificaciones</strong>
                                <div>
                                    <button
                                        onClick={marcarTodasComoLeidas}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#0077cc',
                                            cursor: 'pointer',
                                            fontSize: 13
                                        }}
                                    >
                                        Marcar todas
                                    </button>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 6 }} />

                            {loadingNotifications ? (
                                <div style={{ padding: 12 }}>Cargando...</div>
                            ) : notifications.length === 0 ? (
                                <div style={{ padding: 12 }}>No hay notificaciones</div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => marcarComoLeida(n.id)}
                                        style={{
                                            padding: 10,
                                            borderRadius: 6,
                                            background: Number(n.leido) === 0 ? 'rgba(255,154,0,0.08)' : 'transparent',
                                            marginTop: 8,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontSize: 14, fontWeight: Number(n.leido) === 0 ? 700 : 500 }}>
                                            {n.mensaje}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                                            {new Date(n.creado_en).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Perfil de usuario + dropdown */}
                <div className="profile-wrapper" ref={profileWrapperRef}>
                    <button
                        type="button"
                        className="profile-trigger"
                        onClick={handleToggleProfileMenu}
                        onTouchEnd={(e) => e.stopPropagation()}
                        aria-expanded={showProfileMenu}
                        aria-haspopup="true"
                        aria-label="Menú de usuario"
                    >
                        <img
                            src={fotoPerfilUrl}
                            alt="Perfil"
                            className="profile-image"
                        />
                    </button>

                    {showProfileMenu && (
                        <div className="profile-dropdown" ref={profileDropdownRef}>
                            <button
                                type="button"
                                className="profile-dropdown-item"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    onOpenModificarPerfil();
                                }}
                            >
                                <FaUserEdit className="profile-dropdown-icon" />
                                <span>Modificar datos de usuario</span>
                            </button>
                            <button
                                type="button"
                                className="profile-dropdown-item profile-dropdown-logout"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    onLogout();
                                }}
                            >
                                <FaSignOutAlt className="profile-dropdown-icon" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default HomeHeader;

