import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { esSeccionDesdeMail } from '../../utils/seccionesMail';
import { useAuth } from '../../context/AuthContext';
import './HomeLayout.css';
import { FaBars } from 'react-icons/fa';
import perfil from '../../assets/user.png';
import { STATIC_URL, API_URL } from '../../services/apiConfig';

// Subcomponentes modulares de la interfaz
import HomeHeader from './components/HomeHeader';
import HomeSidebar from './components/HomeSidebar';
import HomeContent from './components/HomeContent';

// Carga diferida (Code Splitting) para vistas secundarias y módulos administrativos
const BuscarTrabajo = lazy(() => import('../buscarTrabajo/BuscarTrabajo'));
const TrabajosAsignados = lazy(() => import('../trabajos asignados/trabajoasignado'));
const MisPresupuestos = lazy(() => import('./MisPresupuestos'));
const ProfesionalesFavoritos = lazy(() => import('./ProfesionalesFavoritos'));
const MisServicios = lazy(() => import('./MisServicios'));
const MiCalendario = lazy(() => import('./MiCalendario'));
const TrabajosCancelados = lazy(() => import('../trabajos cancelados/TrabajosCancelados'));
const EstadisticasCliente = lazy(() => import('./EstadisticasCliente'));
const EstadisticasProfesional = lazy(() => import('./EstadisticasProfesional'));

// Vistas de administración (solo se cargan si el usuario es admin)
const AdminGestion = lazy(() => import('./admin/AdminGestion'));
const AdminCategorias = lazy(() => import('./admin/AdminCategorias'));
const AdminEstadisticasGenerales = lazy(() => import('./admin/AdminEstadisticasGenerales'));
const AdminReportesIngresos = lazy(() => import('./admin/AdminReportesIngresos'));
const AdminAnalisisUsuarios = lazy(() => import('./admin/AdminAnalisisUsuarios'));

// Modales globales diferidos
const PublicarProblemaForm = lazy(() => import('../../components/PublicarProblemaForm'));
const ModificarPerfilForm = lazy(() => import('../../components/ModificarPerfilForm'));

const LoadingFallback = () => (
    <div className="loading-container">
        <div className="loading-spinner" />
        <p>Cargando vista...</p>
    </div>
);

const HomeLayout = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // -----------------------------------------------------------------------
    // Auth centralizado
    // -----------------------------------------------------------------------
    const { user: userData, userType, logout, updateUser } = useAuth();

    // -----------------------------------------------------------------------
    // Estado local de UI
    // -----------------------------------------------------------------------
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [showProblemaForm, setShowProblemaForm] = useState(false);
    const [showModificarPerfil, setShowModificarPerfil] = useState(false);

    // El administrador entra directo a la gestión de usuarios
    const [activeTab, setActiveTab] = useState(() => {
        const seccion = new URLSearchParams(window.location.search).get('seccion');
        if (seccion && esSeccionDesdeMail(seccion) && userData) {
            return seccion;
        }
        return userType === 'admin' ? 'usuarios' : 'dashboard';
    });

    // Redirección si viene con query param 'seccion' desde un email
    useEffect(() => {
        const seccion = searchParams.get('seccion');
        if (!seccion || !esSeccionDesdeMail(seccion)) return;

        if (!userData) {
            navigate(`/?seccion=${encodeURIComponent(seccion)}`, { replace: true });
            return;
        }

        setActiveTab(seccion);
        navigate('/main', { replace: true });
    }, [searchParams, navigate, userData]);

    // Cargar categorías activas (solo para clientes y profesionales)
    const fetchActiveCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await fetch(`${API_URL}/categories/active`);
            const data = await response.json();

            if (data.success) {
                const categoriesWithImages = data.data.map(category => ({
                    id: category.id,
                    name: category.nombre,
                    image: category.imagen
                        ? `${STATIC_URL}/uploads/categorias/${category.imagen}`
                        : perfil,
                    estado: category.estado
                }));
                setCategories(categoriesWithImages);
            } else {
                console.error('Error al obtener categorías:', data.message);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        if (userType === 'admin') return;
        fetchActiveCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userType]);

    // Bloquear scroll de body cuando el menú móvil está abierto
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }
        return () => {
            document.body.classList.remove('menu-open');
        };
    }, [mobileMenuOpen]);

    // Cerrar menú móvil al redimensionar ventana
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    // Modal modificar perfil z-index class en body
    useEffect(() => {
        if (showModificarPerfil) {
            document.body.classList.add('perfil-modal-open');
        } else {
            document.body.classList.remove('perfil-modal-open');
        }
        return () => document.body.classList.remove('perfil-modal-open');
    }, [showModificarPerfil]);

    // Handlers
    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    /** Delega el logout al AuthContext (limpia estado + localStorage + redirige) */
    const handleLogout = () => logout();

    /** Fusiona cambios del perfil en el AuthContext */
    const handlePerfilSuccess = (updatedData) => {
        updateUser(updatedData);
    };

    const handleOpenProblemaForm = () => setShowProblemaForm(true);
    const handleCloseProblemaForm = () => setShowProblemaForm(false);
    const handleProblemaSubmit = (data) => {
        console.log('Solicitud creada:', data);
    };

    // Renderizado según pestaña activa
    const renderTabContent = () => {
        switch (activeTab) {
            case 'buscar-trabajo':
                return <BuscarTrabajo isTab={true} />;
            case 'trabajos-asignados':
                return <TrabajosAsignados isTab={true} />;
            case 'mis-presupuestos':
                return <MisPresupuestos />;
            case 'profesionales-favoritos':
                return <ProfesionalesFavoritos />;
            case 'mis-servicios':
                return <MisServicios isTab={true} />;
            case 'calendario':
                return <MiCalendario />;
            case 'cancelaciones':
                return <TrabajosCancelados isTab={true} />;
            case 'estadisticas':
                return userType === 'cliente'
                    ? <EstadisticasCliente />
                    : <EstadisticasProfesional />;
            case 'usuarios':
                return <AdminGestion vista="usuarios" />;
            case 'clientes':
                return <AdminGestion vista="clientes" />;
            case 'profesionales':
                return <AdminGestion vista="profesionales" />;
            case 'categorias':
                return <AdminCategorias />;
            case 'estadisticas-generales':
                return <AdminEstadisticasGenerales />;
            case 'reportes-ingresos':
                return <AdminReportesIngresos />;
            case 'analisis-usuarios':
                return <AdminAnalisisUsuarios />;
            case 'contacto':
                return (
                    <div className="tab-content">
                        <h2>Contacto y Soporte</h2>
                        <p>Esta funcionalidad estará disponible próximamente.</p>
                    </div>
                );
            default:
                if (userType === 'admin') {
                    return <AdminGestion vista="usuarios" />;
                }
                return (
                    <HomeContent
                        categories={categories}
                        loadingCategories={loadingCategories}
                        userType={userType}
                        onOpenProblemaForm={handleOpenProblemaForm}
                    />
                );
        }
    };

    return (
        <div className="dashboard">
            {/* Toggle de menú móvil */}
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Abrir menú">
                <FaBars />
            </button>

            {/* Overlay para móvil */}
            <div
                className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
                onClick={closeMobileMenu}
            />

            {/* Menú lateral modular */}
            <HomeSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                categories={categories}
                mobileMenuOpen={mobileMenuOpen}
                closeMobileMenu={closeMobileMenu}
            />

            {/* Contenido principal */}
            <div className="main-content">
                {/* Header modular */}
                <HomeHeader
                    setActiveTab={setActiveTab}
                    onOpenModificarPerfil={() => setShowModificarPerfil(true)}
                />

                {/* Área de vistas con Suspense */}
                <main className="dashboard-main">
                    <Suspense fallback={<LoadingFallback />}>
                        {renderTabContent()}
                    </Suspense>
                </main>
            </div>

            {/* Modales globales con Suspense */}
            <Suspense fallback={null}>
                {showProblemaForm && (
                    <PublicarProblemaForm
                        isOpen={showProblemaForm}
                        onClose={handleCloseProblemaForm}
                        onSubmit={handleProblemaSubmit}
                    />
                )}
                {showModificarPerfil && (
                    <ModificarPerfilForm
                        isOpen={showModificarPerfil}
                        onClose={() => setShowModificarPerfil(false)}
                        userType={userType}
                        usuarioId={userData?.id}
                        onSuccess={handlePerfilSuccess}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default HomeLayout;
