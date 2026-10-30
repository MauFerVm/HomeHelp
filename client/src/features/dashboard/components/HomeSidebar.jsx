import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    FaTimes,
    FaHome,
    FaTags,
    FaChevronUp,
    FaChevronDown,
    FaClipboardList,
    FaStar,
    FaEnvelope,
    FaChartBar,
    FaTools,
    FaBriefcase,
    FaCalendarAlt,
    FaTimesCircle,
    FaUsers,
    FaUser,
    FaUserTie,
    FaSignOutAlt
} from 'react-icons/fa';
import logoHomeHelp from '../../../assets/logo_homehelp.png';
import './HomeSidebar.css';

const HomeSidebar = ({
    activeTab,
    setActiveTab,
    categories = [],
    mobileMenuOpen,
    closeMobileMenu,
    userType: propUserType,
    onLogout: propOnLogout
}) => {
    const { userType: authUserType, logout } = useAuth();
    const userType = propUserType || authUserType;
    const handleLogout = propOnLogout || logout;
    const [categoriesExpanded, setCategoriesExpanded] = useState(false);

    const toggleCategories = () => {
        setCategoriesExpanded(!categoriesExpanded);
    };

    return (
        <aside className={`sidebar ${mobileMenuOpen ? 'active' : ''}`}>
            <div className="sidebar-header">
                <img src={logoHomeHelp} alt="Home Help" className="sidebar-logo" />
                {mobileMenuOpen && (
                    <button className="mobile-close" onClick={closeMobileMenu}>
                        <FaTimes />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {userType !== 'admin' && (
                    <div className="nav-section">
                        <h3 className="nav-section-title">MENU</h3>
                        <ul className="nav-menu">
                            <li
                                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                                onClick={() => {
                                    closeMobileMenu();
                                    setActiveTab('dashboard');
                                }}
                            >
                                <FaHome className="nav-icon" />
                                <span>Inicio</span>
                            </li>
                        </ul>
                    </div>
                )}

                {/* Sidebar para Clientes */}
                {userType === 'cliente' && (
                    <>
                        <div className="nav-section">
                            <div className="nav-section-header" onClick={toggleCategories}>
                                <h3 className="nav-section-title">
                                    <FaTags className="nav-icon" />
                                    CATEGORIAS
                                </h3>
                                {categoriesExpanded ? <FaChevronUp className="expand-icon" /> : <FaChevronDown className="expand-icon" />}
                            </div>
                            {categoriesExpanded && (
                                <ul className="nav-submenu">
                                    {categories.map((category, index) => (
                                        <li
                                            key={category.id ?? index}
                                            className="nav-subitem"
                                            onClick={closeMobileMenu}
                                            data-user-type="cliente"
                                        >
                                            <span>{category.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">SERVICIOS CONTRATADOS</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'mis-servicios' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('mis-servicios'); }}
                                    data-user-type="cliente"
                                >
                                    <FaClipboardList className="nav-icon" />
                                    <span>Mis Servicios</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'mis-presupuestos' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('mis-presupuestos'); }}
                                    data-user-type="cliente"
                                >
                                    <FaClipboardList className="nav-icon" />
                                    <span>Mis presupuestos</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'profesionales-favoritos' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('profesionales-favoritos'); }}
                                    data-user-type="cliente"
                                >
                                    <FaStar className="nav-icon" />
                                    <span>Profesionales favoritos</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">CONTACTO</h3>
                            <ul className="nav-menu">
                                <li className="nav-item" onClick={closeMobileMenu} data-user-type="cliente">
                                    <FaEnvelope className="nav-icon" />
                                    <span>Soporte</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">GRAFICOS</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'estadisticas' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('estadisticas');
                                    }}
                                    data-user-type="cliente"
                                >
                                    <FaChartBar className="nav-icon" />
                                    <span>Estadísticas</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {/* Sidebar para Profesionales */}
                {userType === 'profesional' && (
                    <>
                        <div className="nav-section">
                            <h3 className="nav-section-title">TRABAJOS</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'trabajos-asignados' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('trabajos-asignados');
                                    }}
                                    data-user-type="profesional"
                                >
                                    <FaTools className="nav-icon" />
                                    <span>Trabajos Asignados</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'buscar-trabajo' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('buscar-trabajo');
                                    }}
                                    data-user-type="profesional"
                                >
                                    <FaBriefcase className="nav-icon" />
                                    <span>Buscar Trabajo</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">CALENDARIO</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'calendario' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('calendario');
                                    }}
                                    data-user-type="profesional"
                                >
                                    <FaCalendarAlt className="nav-icon" />
                                    <span>Mi Calendario</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">CANCELACIONES</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'cancelaciones' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('cancelaciones');
                                    }}
                                    data-user-type="profesional"
                                >
                                    <FaTimesCircle className="nav-icon" />
                                    <span>Trabajos Cancelados</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">ESTADISTICAS</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'estadisticas' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('estadisticas');
                                    }}
                                    data-user-type="profesional"
                                >
                                    <FaChartBar className="nav-icon" />
                                    <span>Estadísticas de Mis Servicios</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">CONTACTO</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'contacto' ? 'active' : ''}`}
                                    onClick={() => {
                                        closeMobileMenu();
                                        setActiveTab('contacto');
                                    }}
                                    data-user-type="profesional"
                                >
                                    <FaEnvelope className="nav-icon" />
                                    <span>Soporte</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {/* Sidebar para Administradores */}
                {userType === 'admin' && (
                    <>
                        <div className="nav-section">
                            <h3 className="nav-section-title">GESTION DE USUARIOS</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'usuarios' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('usuarios'); }}
                                    data-user-type="admin"
                                >
                                    <FaUsers className="nav-icon" />
                                    <span>Usuarios</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('clientes'); }}
                                    data-user-type="admin"
                                >
                                    <FaUser className="nav-icon" />
                                    <span>Clientes</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'profesionales' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('profesionales'); }}
                                    data-user-type="admin"
                                >
                                    <FaUserTie className="nav-icon" />
                                    <span>Profesionales</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">GESTION DE SERVICIOS</h3>
                            <ul className="nav-menu">
                                <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                    <FaTools className="nav-icon" />
                                    <span>Servicios</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'categorias' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('categorias'); }}
                                    data-user-type="admin"
                                >
                                    <FaTags className="nav-icon" />
                                    <span>Categorías</span>
                                </li>
                                <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                    <FaClipboardList className="nav-icon" />
                                    <span>Solicitudes</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">REPORTES</h3>
                            <ul className="nav-menu">
                                <li
                                    className={`nav-item ${activeTab === 'estadisticas-generales' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('estadisticas-generales'); }}
                                    data-user-type="admin"
                                >
                                    <FaChartBar className="nav-icon" />
                                    <span>Estadísticas Generales</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'reportes-ingresos' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('reportes-ingresos'); }}
                                    data-user-type="admin"
                                >
                                    <FaChartBar className="nav-icon" />
                                    <span>Reportes de Ingresos</span>
                                </li>
                                <li
                                    className={`nav-item ${activeTab === 'analisis-usuarios' ? 'active' : ''}`}
                                    onClick={() => { closeMobileMenu(); setActiveTab('analisis-usuarios'); }}
                                    data-user-type="admin"
                                >
                                    <FaChartBar className="nav-icon" />
                                    <span>Análisis de Usuarios</span>
                                </li>
                            </ul>
                        </div>

                        <div className="nav-section">
                            <h3 className="nav-section-title">CONFIGURACION</h3>
                            <ul className="nav-menu">
                                <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                    <FaEnvelope className="nav-icon" />
                                    <span>Configuración del Sistema</span>
                                </li>
                                <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                    <FaEnvelope className="nav-icon" />
                                    <span>Backup y Restauración</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {/* Logout Section */}
                <div className="nav-section logout-section">
                    <ul className="nav-menu">
                        <li
                            className="nav-item logout-item"
                            onClick={() => {
                                closeMobileMenu();
                                handleLogout();
                            }}
                        >
                            <FaSignOutAlt className="nav-icon" />
                            <span>Cerrar Sesión</span>
                        </li>
                    </ul>
                </div>
            </nav>
        </aside>
    );
};

export default HomeSidebar;

