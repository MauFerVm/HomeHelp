import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import PublicarProblemaForm from '../../components/PublicarProblemaForm';
import ModificarPerfilForm from '../../components/ModificarPerfilForm';
import BuscarTrabajo from '../buscarTrabajo/BuscarTrabajo';
import MisPresupuestos from './MisPresupuestos';
import TrabajosAsignados from '../trabajos asignados/trabajoasignado';
import TrabajosCancelados from '../trabajos cancelados/TrabajosCancelados';
import MisServicios from './MisServicios';
import MiCalendario from './MiCalendario';
import EstadisticasProfesional from './EstadisticasProfesional';
import {
    FaBell,
    FaSearch,
    FaChevronLeft,
    FaChevronRight,
    FaChevronDown,
    FaPlus,
    FaChevronUp,
    FaHome,
    FaClipboardList,
    FaChartBar,
    FaEnvelope,
    FaTags,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaCalendarAlt,
    FaTools,
    FaTimesCircle,
    FaUserTie,
    FaBriefcase,
    FaUserEdit
} from 'react-icons/fa';
import logoHomeHelp from '../../assets/logo_homehelp.png';
import perfil from '../../assets/user.png';
import albañil from '../../assets/albañil.jpg';
import carpintero from '../../assets/carpintero.jpeg';
import cerrajero from '../../assets/cerrajero.jpg';
import electricidad from '../../assets/electricidad.jpg';
import gasista from '../../assets/gasista.jpeg';
import herrero from '../../assets/herrero.jpg';
import pintor from '../../assets/pintor.jpg';
import plomeria from '../../assets/plomeria.png';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [categoriesExpanded, setCategoriesExpanded] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [itemsPerView, setItemsPerView] = useState(4);
    const [carouselGap, setCarouselGap] = useState(24);
    const carouselRef = useRef(null);
    const [carouselWidth, setCarouselWidth] = useState(0);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [featuredProfessionals, setFeaturedProfessionals] = useState([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(true);
    const [showProblemaForm, setShowProblemaForm] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showModificarPerfil, setShowModificarPerfil] = useState(false);

    // Notificaciones
    const [notifications, setNotifications] = useState([]); // array de notificaciones
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const notiDropdownRef = useRef(null);
    const bellRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const profileWrapperRef = useRef(null);

    // Estado para la pestaña activa del dashboard
    const [activeTab, setActiveTab] = useState('dashboard');

    // Estado para el tipo de usuario (cliente, profesional o admin)
    // Se obtiene automáticamente del localStorage después del login
    // El valor se establece desde la base de datos usando el campo 'rol' de la tabla 'usuario'
    // Valores posibles: 'cliente', 'profesional', 'admin'
    const [userType, setUserType] = useState(() => {
        const storedUserType = localStorage.getItem('userType') || 'cliente';
        console.log('userType obtenido del localStorage:', storedUserType);
        return storedUserType;
    });

    // Estado para la información del usuario incluyendo foto de perfil
    const [userData, setUserData] = useState(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            try {
                return JSON.parse(storedUserData);
            } catch (error) {
                console.error('Error al parsear userData:', error);
                return null;
            }
        }
        return null;
    });

    // Verificar que el userType esté sincronizado con el localStorage
    useEffect(() => {
        const storedUserType = localStorage.getItem('userType');
        if (storedUserType && storedUserType !== userType) {
            console.log('Actualizando userType desde localStorage:', storedUserType);
            setUserType(storedUserType);
        }
    }, [userType]);

    // Mapeo de imágenes para las categorías
    const categoryImageMap = {
        'Albañileria': albañil,
        'Carpinteria': carpintero,
        'Cerrajeria': cerrajero,
        'Electricidad': electricidad,
        'Gas': gasista,
        'Herreria': herrero,
        'Pintura': pintor,
        'Plomeria': plomeria,
        'Plomería': plomeria // Por si hay variaciones en el nombre
    };

    // Función para obtener categorías activas desde la API
    const fetchActiveCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3002/api/categories/active');
            const data = await response.json();

            if (data.success) {
                // Mapear las categorías con sus imágenes correspondientes
                const categoriesWithImages = data.data.map(category => ({
                    id: category.id,
                    name: category.nombre,
                    image: categoryImageMap[category.nombre] || perfil, // Usar imagen por defecto si no se encuentra
                    estado: category.estado
                }));
                setCategories(categoriesWithImages);
            } else {
                console.error('Error al obtener categorías:', data.message);
                // En caso de error, usar categorías por defecto
                setCategories([
                    { name: 'Albañileria', image: albañil },
                    { name: 'Carpinteria', image: carpintero },
                    { name: 'Cerrajeria', image: cerrajero },
                    { name: 'Electricidad', image: electricidad },
                    { name: 'Gas', image: gasista },
                    { name: 'Herreria', image: herrero },
                    { name: 'Pintura', image: pintor },
                    { name: 'Plomería', image: plomeria }
                ]);
            }
        } catch (error) {
            console.error('Error al conectar con la API:', error);
            // En caso de error de conexión, usar categorías por defecto
            setCategories([
                { name: 'Albañileria', image: albañil },
                { name: 'Carpinteria', image: carpintero },
                { name: 'Cerrajeria', image: cerrajero },
                { name: 'Electricidad', image: electricidad },
                { name: 'Gas', image: gasista },
                { name: 'Herreria', image: herrero },
                { name: 'Pintura', image: pintor },
                { name: 'Plomería', image: plomeria }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatDisplayName = (nombreApellido) => {
        if (!nombreApellido) return 'Profesional';
        const parts = nombreApellido.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[1].charAt(0)}.`;
    };

    const getProfessionalImage = (fotoPerfil) => {
        if (fotoPerfil) {
            return `http://localhost:3002/uploads/profiles/${fotoPerfil}`;
        }
        return perfil;
    };

    const fetchFeaturedProfessionals = async () => {
        try {
            setLoadingProfessionals(true);
            const response = await fetch('http://localhost:3002/api/calificaciones/destacados');
            const data = await response.json();

            if (data.success) {
                setFeaturedProfessionals((data.data || []).slice(0, 5));
            } else {
                console.error('Error al obtener profesionales destacados:', data.message);
                setFeaturedProfessionals([]);
            }
        } catch (error) {
            console.error('Error al conectar con la API de profesionales:', error);
            setFeaturedProfessionals([]);
        } finally {
            setLoadingProfessionals(false);
        }
    };

    // Cargar categorías al montar el componente
    useEffect(() => {
        fetchActiveCategories();
        fetchFeaturedProfessionals();
    }, []);

    // Cerrar dropdowns si clic fuera
    useEffect(() => {
        const onClickOutside = (e) => {
            const target = e.target;
            if (showNotifications) {
                if (notiDropdownRef.current && !notiDropdownRef.current.contains(target) &&
                    bellRef.current && !bellRef.current.contains(target)) {
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

    useEffect(() => {
        if (showModificarPerfil) {
            document.body.classList.add('perfil-modal-open');
        } else {
            document.body.classList.remove('perfil-modal-open');
        }
        return () => document.body.classList.remove('perfil-modal-open');
    }, [showModificarPerfil]);

    // Opcional: cargar notificaciones una vez al montar (sin abrir dropdown)
    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line
    }, []);


    const getCarouselMetrics = (availableWidth) => {
        const viewport = window.innerWidth;
        if (viewport <= 480) {
            return { items: 1, gap: 12 };
        }
        if (viewport <= 768) {
            return { items: 2, gap: 12 };
        }
        if (availableWidth > 0 && availableWidth < 560) {
            return { items: 2, gap: 16 };
        }
        if (availableWidth > 0 && availableWidth < 860) {
            return { items: 3, gap: 16 };
        }
        return { items: 4, gap: 24 };
    };

    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return undefined;

        const updateCarousel = () => {
            const styles = window.getComputedStyle(el);
            const padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
            const availableWidth = Math.max(0, el.clientWidth - padding);
            const { items, gap } = getCarouselMetrics(availableWidth);
            setCarouselWidth(availableWidth);
            setItemsPerView(items);
            setCarouselGap(gap);
        };

        updateCarousel();
        const observer = new ResizeObserver(updateCarousel);
        observer.observe(el);
        window.addEventListener('resize', updateCarousel);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateCarousel);
        };
    }, [loading]);

    const cardWidth = carouselWidth > 0
        ? (carouselWidth - carouselGap * Math.max(0, itemsPerView - 1)) / itemsPerView
        : 0;
    const maxSlideIndex = Math.max(0, categories.length - itemsPerView);

    useEffect(() => {
        setCurrentSlide((prev) => Math.min(prev, maxSlideIndex));
    }, [maxSlideIndex]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev <= 0 ? maxSlideIndex : prev - 1));
    };

    // Las flechas nunca se bloquean - siempre permiten navegación circular
    const canGoNext = true;
    const canGoPrev = true;

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Búsqueda:', searchQuery);
    };

    const toggleCategories = () => {
        setCategoriesExpanded(!categoriesExpanded);
    };

    const handleLogout = () => {
        // Limpiar localStorage al hacer logout
        localStorage.removeItem('userType');
        localStorage.removeItem('userData');
        // Aquí puedes agregar lógica adicional de logout si es necesario
        // Por ejemplo, limpiar cookies, etc.
        navigate('/');
    };

    const handlePerfilSuccess = (updatedData) => {
        const merged = { ...userData, ...updatedData };
        setUserData(merged);
        localStorage.setItem('userData', JSON.stringify(merged));
    };

    const handleOpenModificarPerfil = () => {
        setShowProfileMenu(false);
        setShowModificarPerfil(true);
    };

    const handleToggleProfileMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowNotifications(false);
        setShowProfileMenu(prev => !prev);
    };

    // Cargar notificaciones del usuario
    const fetchNotifications = async () => {
        const userDataRaw = localStorage.getItem('userData');
        if (!userDataRaw) return;
        const userData = JSON.parse(userDataRaw);
        if (!userData?.id) return;

        try {
            setLoadingNotifications(true);
            const res = await fetch(`http://localhost:3002/api/notificaciones/usuario/${userData.id}`);
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
                
                // Si es un profesional y la notificación es de tipo 'solicitud', cambiar a pestaña Buscar Trabajo
                if (userType === 'profesional') {
                    const notificacion = notifications.find(n => n.id === notiId);
                    if (notificacion && notificacion.tipo_notificacion === 'solicitud') {
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
        const userData = JSON.parse(userDataRaw);
        try {
            const res = await fetch(`http://localhost:3002/api/notificaciones/marcar-todas/${userData.id}`, {
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


    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const handleOpenProblemaForm = () => {
        setShowProblemaForm(true);
    };

    const handleCloseProblemaForm = () => {
        setShowProblemaForm(false);
    };

    const handleProblemaSubmit = (data) => {
        console.log('Solicitud creada:', data);
        // Aquí puedes agregar lógica adicional después de crear la solicitud
        // Por ejemplo, actualizar una lista de solicitudes, mostrar notificación, etc.
    };

    // Función para renderizar el contenido según la pestaña activa
    const renderTabContent = () => {
        switch (activeTab) {
            case 'buscar-trabajo':
                return <BuscarTrabajo isTab={true} />;
            case 'trabajos-asignados':
                return <TrabajosAsignados isTab={true} />;
            case 'mis-presupuestos':
                return <MisPresupuestos />;
            case 'mis-servicios':
                return <MisServicios isTab={true} />;
            case 'calendario':
                return <MiCalendario />;
            case 'cancelaciones':
                return <TrabajosCancelados isTab={true} />;
            case 'estadisticas':
                return <EstadisticasProfesional />;
            case 'contacto':
                return (
                    <div className="tab-content">
                        <h2>Contacto y Soporte</h2>
                        <p>Esta funcionalidad estará disponible próximamente.</p>
                    </div>
                );
            default:
                return renderDashboardContent();
        }
    };

    // Función para renderizar el contenido del dashboard principal
    const renderDashboardContent = () => (
        <>
            {/* Greeting Section */}
            <div className="greeting-section">
                <div className="greeting-content">
                    <div className="greeting-text">
                        <h1 className="greeting-title">¿Necesitas ayuda en tu hogar?</h1>
                        <p className="greeting-subtitle">Conectamos con los mejores profesionales cerca tuyo</p>
                    </div>
                    {/* Post Problem Button - oculto para profesionales */}
                    {userType !== 'profesional' && (
                        <div className="post-problem-section">
                            <button
                                className="post-problem-button"
                                onClick={handleOpenProblemaForm}
                            >
                                <FaPlus />
                                <span>Publicar un problema</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="¿Qué necesitas arreglar hoy?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-button">
                        <FaSearch />
                    </button>
                </form>
            </div>

            {/* Categories Section */}
            <div className="categories-section">
                <h2 className="section-title">Categorías destacadas</h2>
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Cargando categorías...</p>
                    </div>
                ) : (
                    <div className="categories-container">
                        <button
                            className={`nav-button prev ${!canGoPrev ? 'disabled' : ''}`}
                            onClick={prevSlide}
                            disabled={!canGoPrev}
                        >
                            <FaChevronLeft />
                        </button>

                        <div className="categories-carousel" ref={carouselRef}>
                            <div
                                className="categories-track"
                                style={{
                                    gap: `${carouselGap}px`,
                                    transform: cardWidth
                                        ? `translateX(-${currentSlide * (cardWidth + carouselGap)}px)`
                                        : 'translateX(0)'
                                }}
                            >
                                {categories.map((category, index) => (
                                    <div
                                        key={category.id ?? index}
                                        className="category-card"
                                        style={cardWidth ? { width: cardWidth, flex: `0 0 ${cardWidth}px` } : undefined}
                                    >
                                        <div className="category-image-container">
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="category-image"
                                            />
                                        </div>
                                        <h3 className="category-name">{category.name}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className={`nav-button next ${!canGoNext ? 'disabled' : ''}`}
                            onClick={nextSlide}
                            disabled={!canGoNext}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* Featured Professionals Section */}
            <div className="professionals-section">
                <h2 className="section-title">Profesionales destacados</h2>
                <div className="professionals-list">
                    {loadingProfessionals ? (
                        <p className="professionals-status">Cargando profesionales...</p>
                    ) : featuredProfessionals.length === 0 ? (
                        <p className="professionals-status">No hay profesionales calificados aún.</p>
                    ) : (
                        featuredProfessionals.map((professional) => (
                            <div key={professional.persona_id} className="professional-card">
                                <img
                                    src={getProfessionalImage(professional.foto_perfil)}
                                    alt={professional.nombre_apellido}
                                    className="professional-image"
                                />
                                <div className="professional-info">
                                    <h3 className="professional-name">
                                        {formatDisplayName(professional.nombre_apellido)}
                                    </h3>
                                    <p className="professional-profession">
                                        {professional.tipo_profesional_nombre || 'Profesional'} • ★ {professional.promedio_calificacion} ({professional.total_trabajos} trabajos)
                                    </p>
                                </div>
                                <button className="contact-button">✓ Contactar</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );

    // Handle body scroll lock when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }

        // Cleanup function
        return () => {
            document.body.classList.remove('menu-open');
        };
    }, [mobileMenuOpen]);

    // Close mobile menu on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    return (
        <>
            <div className="dashboard">
                {/* Mobile Menu Toggle */}
                <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                    <FaBars />
                </button>

                {/* Mobile Overlay */}
                <div
                    className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                />

                {/* Sidebar */}
                <aside className={`sidebar ${mobileMenuOpen ? 'active' : ''}`}>
                    <div className="sidebar-header">
                        <img src={logoHomeHelp} alt="Home Help" className="sidebar-logo" />
                        {/* Solo mostrar el botón de cerrar en móvil */}
                        {mobileMenuOpen && (
                            <button className="mobile-close" onClick={closeMobileMenu}>
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <nav className="sidebar-nav">
                        <div className="nav-section">
                            <h3 className="nav-section-title">MENU</h3>
                            <ul className="nav-menu">
                                <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => {
                                    closeMobileMenu();
                                    setActiveTab('dashboard');
                                }}>
                                    <FaHome className="nav-icon" />
                                    <span>Dashboard</span>
                                </li>
                            </ul>
                        </div>

                        {/* 
                        LÓGICA DEL SIDEBAR BASADA EN EL ROL DEL USUARIO
                        El sidebar se muestra según el valor del campo 'rol' de la base de datos:
                        - 'cliente': Muestra opciones para clientes (categorías, servicios, etc.)
                        - 'profesional': Muestra opciones para profesionales (trabajos, calendario, etc.)
                        - 'admin': Muestra opciones para administradores (gestión, reportes, etc.)
                    */}

                        {/* Debug: mostrar qué sidebar se está renderizando */}
                        {console.log('Renderizando sidebar para userType:', userType)}

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
                                                <li key={index} className="nav-subitem" onClick={closeMobileMenu} data-user-type="cliente">
                                                    <span>{category.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="nav-section">
                                    <h3 className="nav-section-title">SERVICIOS CONTRATADOS</h3>
                                    <ul className="nav-menu">
                                        <li className={`nav-item ${activeTab === 'mis-servicios' ? 'active' : ''}`} onClick={() => { closeMobileMenu(); setActiveTab('mis-servicios'); }} data-user-type="cliente">
                                            <FaClipboardList className="nav-icon" />
                                            <span>Mis Servicios</span>
                                        </li>
                                        <li className={`nav-item ${activeTab === 'mis-presupuestos' ? 'active' : ''}`} onClick={() => { closeMobileMenu(); setActiveTab('mis-presupuestos'); }} data-user-type="cliente">
                                            <FaClipboardList className="nav-icon" />
                                            <span>Mis presupuestos</span>
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
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="cliente">
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
                                        <li className={`nav-item ${activeTab === 'trabajos-asignados' ? 'active' : ''}`} onClick={() => {
                                            closeMobileMenu();
                                            setActiveTab('trabajos-asignados');
                                        }} data-user-type="profesional">
                                            <FaTools className="nav-icon" />
                                            <span>Trabajos Asignados</span>
                                        </li>
                                        <li className={`nav-item ${activeTab === 'buscar-trabajo' ? 'active' : ''}`} onClick={() => {
                                            closeMobileMenu();
                                            setActiveTab('buscar-trabajo');
                                        }} data-user-type="profesional">
                                            <FaBriefcase className="nav-icon" />
                                            <span>Buscar Trabajo</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="nav-section">
                                    <h3 className="nav-section-title">CALENDARIO</h3>
                                    <ul className="nav-menu">
                                        <li className={`nav-item ${activeTab === 'calendario' ? 'active' : ''}`} onClick={() => {
                                            closeMobileMenu();
                                            setActiveTab('calendario');
                                        }} data-user-type="profesional">
                                            <FaCalendarAlt className="nav-icon" />
                                            <span>Mi Calendario</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="nav-section">
                                    <h3 className="nav-section-title">CANCELACIONES</h3>
                                    <ul className="nav-menu">
                                        <li className={`nav-item ${activeTab === 'cancelaciones' ? 'active' : ''}`} onClick={() => {
                                            closeMobileMenu();
                                            setActiveTab('cancelaciones');
                                        }} data-user-type="profesional">
                                            <FaTimesCircle className="nav-icon" />
                                            <span>Trabajos Cancelados</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="nav-section">
                                    <h3 className="nav-section-title">ESTADISTICAS</h3>
                                    <ul className="nav-menu">
                                        <li className={`nav-item ${activeTab === 'estadisticas' ? 'active' : ''}`} onClick={() => {
                                            closeMobileMenu();
                                            setActiveTab('estadisticas');
                                        }} data-user-type="profesional">
                                            <FaChartBar className="nav-icon" />
                                            <span>Estadísticas de Mis Servicios</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="nav-section">
                                    <h3 className="nav-section-title">CONTACTO</h3>
                                    <ul className="nav-menu">
                                        <li className={`nav-item ${activeTab === 'contacto' ? 'active' : ''}`} onClick={() => {
                                            closeMobileMenu();
                                            setActiveTab('contacto');
                                        }} data-user-type="profesional">
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
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                            <FaUserTie className="nav-icon" />
                                            <span>Usuarios</span>
                                        </li>
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                            <FaUserTie className="nav-icon" />
                                            <span>Clientes</span>
                                        </li>
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
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
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
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
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                            <FaChartBar className="nav-icon" />
                                            <span>Estadísticas Generales</span>
                                        </li>
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
                                            <FaChartBar className="nav-icon" />
                                            <span>Reportes de Ingresos</span>
                                        </li>
                                        <li className="nav-item" onClick={closeMobileMenu} data-user-type="admin">
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
                                <li className="nav-item logout-item" onClick={() => {
                                    closeMobileMenu();
                                    handleLogout();
                                }}>
                                    <FaSignOutAlt className="nav-icon" />
                                    <span>Cerrar Sesión</span>
                                </li>
                            </ul>
                        </div>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="main-content">
                    {/* Header */}
                    <header className="dashboard-header">
                        <div className="header-right">
                            {/* 
                            INDICADOR DEL TIPO DE USUARIO
                            Muestra el rol del usuario obtenido desde la base de datos (campo 'rol')
                            Se aplican estilos específicos según el tipo: cliente, profesional o admin
                        */}
                            <div className="user-type-indicator">
                                {/* Debug: mostrar qué tipo de usuario se está mostrando */}
                                {console.log('Mostrando badge para userType:', userType)}
                                <span className="user-type-badge" data-user-type={userType}>
                                    {userType === 'cliente' ? 'Cliente' :
                                        userType === 'profesional' ? 'Profesional' : 'Administrador'}
                                </span>
                            </div>
                            
                            {/* NOTIFICATIONS ICON + DROPDOWN */}
                            <div className="notification-wrapper" style={{ position: 'relative' }}>
                                <div
                                    className="notification-icon"
                                    ref={bellRef}
                                    onClick={() => { const next = !showNotifications; setShowProfileMenu(false); setShowNotifications(next); if (!showNotifications) fetchNotifications(); }}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                    aria-label="Notificaciones"
                                >
                                    <FaBell />
                                    {unreadCount > 0 && (
                                        <span className="notification-badge" style={{
                                            position: 'absolute',
                                            top: -6,
                                            right: -6,
                                            background: '#ff5a1f',
                                            color: '#fff',
                                            borderRadius: '50%',
                                            padding: '2px 6px',
                                            fontSize: 12,
                                            fontWeight: 700
                                        }}>{unreadCount}</span>
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
                                                <button onClick={marcarTodasComoLeidas} style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#0077cc',
                                                    cursor: 'pointer',
                                                    fontSize: 13
                                                }}>Marcar todas</button>
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
                                        src={userData && userData.foto_perfil
                                            ? `http://localhost:3002/uploads/profiles/${userData.foto_perfil}`
                                            : perfil}
                                        alt="Perfil"
                                        className="profile-image"
                                    />
                                </button>

                                {showProfileMenu && (
                                    <div className="profile-dropdown" ref={profileDropdownRef}>
                                        <button
                                            type="button"
                                            className="profile-dropdown-item"
                                            onClick={handleOpenModificarPerfil}
                                        >
                                            <FaUserEdit className="profile-dropdown-icon" />
                                            <span>Modificar datos de usuario</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="profile-dropdown-item profile-dropdown-logout"
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                handleLogout();
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

                    {/* Main Content */}
                    <main className="dashboard-main">
                        {renderTabContent()}
                    </main>
                </div>

                {/* Modal del formulario de publicar problema */}
                <PublicarProblemaForm
                    isOpen={showProblemaForm}
                    onClose={handleCloseProblemaForm}
                    onSubmit={handleProblemaSubmit}
                />

                <ModificarPerfilForm
                    isOpen={showModificarPerfil}
                    onClose={() => setShowModificarPerfil(false)}
                    userType={userType}
                    usuarioId={userData?.id}
                    onSuccess={handlePerfilSuccess}
                />

            </div>
        </>
    );
};

export default Dashboard;
