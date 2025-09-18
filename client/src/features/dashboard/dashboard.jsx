import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';
import PublicarProblemaForm from '../../components/PublicarProblemaForm';
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
    FaUserTie
} from 'react-icons/fa';
import logoHomeHelp from '../../assets/logo_homehelp.png';
import perfil from '../../assets/perfil.png';
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
    const carouselRef = useRef(null);
    const [carouselWidth, setCarouselWidth] = useState(0);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProblemaForm, setShowProblemaForm] = useState(false);
    
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

    // Cargar categorías al montar el componente
    useEffect(() => {
        fetchActiveCategories();
    }, []);

    // Función para determinar el número de elementos por vista
    const updateItemsPerView = () => {
        const isMobile = window.innerWidth <= 768;
        const isSmallPC = window.innerWidth >= 1000 && window.innerWidth <= 1300;
        const isMediumPC = window.innerWidth >= 1400 && window.innerWidth <= 1500;
        setItemsPerView(isMobile ? 2 : (isSmallPC || isMediumPC ? 3 : 4));
    };

    // Actualizar itemsPerView al montar el componente y al cambiar el tamaño de la ventana
    useEffect(() => {
        updateItemsPerView();
        window.addEventListener('resize', updateItemsPerView);
        return () => window.removeEventListener('resize', updateItemsPerView);
    }, []);
    

    // Las categorías ahora se obtienen dinámicamente desde la API

    // Crear categorías duplicadas solo para pantallas de 1400-1500px
    const isMediumScreen = window.innerWidth >= 1400 && window.innerWidth <= 1500;
    const isLargeScreen = window.innerWidth >= 1600 && window.innerWidth <= 1700;
    const displayCategories = isMediumScreen ? [...categories, ...categories] : categories;

    const nextSlide = () => {
        if (isMediumScreen) {
            // Para pantallas 1400-1500px: navegación circular
            setCurrentSlide(prev => {
                const nextSlide = prev + 3;
                if (nextSlide >= categories.length) {
                    return 0;
                }
                return nextSlide;
            });
        } else {
            // Para otras pantallas: navegación normal
            if (currentSlide < effectiveMaxSlides) {
                setCurrentSlide(currentSlide + 1);
            } else {
                setCurrentSlide(0);
            }
        }
    };

    const prevSlide = () => {
        if (isMediumScreen) {
            // Para pantallas 1400-1500px: navegación circular
            setCurrentSlide(prev => {
                const prevSlide = prev - 1;
                if (prevSlide < 0) {
                    return categories.length - 1;
                }
                return prevSlide;
            });
        } else {
            // Para otras pantallas: navegación normal
            if (currentSlide > 0) {
                setCurrentSlide(currentSlide - 1);
            } else {
                setCurrentSlide(effectiveMaxSlides);
            }
        }
    };

    // Calcular el número máximo de slides basado en el número de categorías y elementos por vista
    const maxSlides = Math.max(0, categories.length - itemsPerView);
    // Para móviles: permitir navegar por todas las categorías (2 por vista)
    // Para PC pequeñas: permitir navegar por todas las categorías (3 por vista)
    // Para PC medianas: permitir navegar por todas las categorías (3 por vista)
    // Para desktop: mantener la lógica actual (4 por vista)
    const effectiveMaxSlides = window.innerWidth <= 768 ? 
        Math.ceil(categories.length / 2) - 1 : // Móvil: 8 categorías / 2 = 4 slides (0,1,2,3)
        (window.innerWidth >= 1000 && window.innerWidth <= 1300) || (window.innerWidth >= 1400 && window.innerWidth <= 1500) ?
        Math.ceil(categories.length / 3) - 1 : // PC pequeña/mediana: 8 categorías / 3 = 3 slides (0,1,2)
        1; // Desktop: mantener como está
    
    // Debug: mostrar información del carrusel
    useEffect(() => {
        console.log('Categorías totales:', categories.length);
        console.log('Elementos por vista:', itemsPerView);
        console.log('Máximo de slides:', maxSlides);
        console.log('Slides efectivos:', effectiveMaxSlides);
        console.log('Slide actual:', currentSlide);
        console.log('Es móvil:', window.innerWidth <= 768);
    }, [categories, itemsPerView, maxSlides, effectiveMaxSlides, currentSlide]);
    
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
                            <li className="nav-item" onClick={closeMobileMenu}>
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
                                    <li className="nav-item" onClick={closeMobileMenu} data-user-type="cliente">
                                        <FaClipboardList className="nav-icon" />
                                        <span>Mis Servicios</span>
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
                                    <li className="nav-item" onClick={closeMobileMenu} data-user-type="profesional">
                                        <FaTools className="nav-icon" />
                                        <span>Trabajos Asignados</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="nav-section">
                                <h3 className="nav-section-title">CALENDARIO</h3>
                                <ul className="nav-menu">
                                    <li className="nav-item" onClick={closeMobileMenu} data-user-type="profesional">
                                        <FaCalendarAlt className="nav-icon" />
                                        <span>Mi Calendario</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="nav-section">
                                <h3 className="nav-section-title">CANCELACIONES</h3>
                                <ul className="nav-menu">
                                    <li className="nav-item" onClick={closeMobileMenu} data-user-type="profesional">
                                        <FaTimesCircle className="nav-icon" />
                                        <span>Trabajos Cancelados</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="nav-section">
                                <h3 className="nav-section-title">ESTADISTICAS</h3>
                                <ul className="nav-menu">
                                    <li className="nav-item" onClick={closeMobileMenu} data-user-type="profesional">
                                        <FaChartBar className="nav-icon" />
                                        <span>Estadísticas de Mis Servicios</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="nav-section">
                                <h3 className="nav-section-title">CONTACTO</h3>
                                <ul className="nav-menu">
                                    <li className="nav-item" onClick={closeMobileMenu} data-user-type="profesional">
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
                        <div className="notification-icon">
                            <FaBell />
                        </div>
                        <img 
                            src={userData && userData.foto_perfil 
                                ? `http://localhost:3002/uploads/profiles/${userData.foto_perfil}` 
                                : perfil} 
                            alt="Perfil" 
                            className="profile-image" 
                        />
                    </div>
                </header>

                {/* Main Content */}
                <main className="dashboard-main">
                    {/* Greeting Section */}
                    <div className="greeting-section">
                                <h1 className="greeting-title">¿Necesitas ayuda en tu hogar?</h1>
                                <p className="greeting-subtitle">Conectamos con los mejores profesionales cerca tuyo</p>
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
                            
                                                        <div className="categories-carousel">
                                <div 
                                    className="categories-track"
                                    style={{ 
                                        transform: isMediumScreen 
                                            ? `translateX(-${currentSlide * (100 / 2.8)}%)`
                                            : isLargeScreen
                                            ? `translateX(-${currentSlide * (110 / 1)}%)`
                                            : `translateX(-${currentSlide * (110 / itemsPerView) * itemsPerView}%)`
                                    }}
                                >
                                    {displayCategories.map((category, index) => (
                                        <div key={index} className="category-card">
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
                            <div className="professional-card">
                                <img src={perfil} alt="Ricardo M." className="professional-image" />
                                <div className="professional-info">
                                    <h3 className="professional-name">Ricardo M.</h3>
                                    <p className="professional-profession">Plomero • ★ 4.8 (120 trabajos)</p>
                                </div>
                                <button className="contact-button">✓ Contactar</button>
                            </div>
                            
                            <div className="professional-card">
                                <img src={perfil} alt="Sofía L." className="professional-image" />
                                <div className="professional-info">
                                    <h3 className="professional-name">Sofía L.</h3>
                                    <p className="professional-profession">Electricista • ★ 4.9 (150 trabajos)</p>
                                </div>
                                <button className="contact-button">✓ Contactar</button>
                            </div>
                            
                            <div className="professional-card">
                                <img src={perfil} alt="Javier P." className="professional-image" />
                                <div className="professional-info">
                                    <h3 className="professional-name">Javier P.</h3>
                                    <p className="professional-profession">Carpintero • ★ 4.7 (90 trabajos)</p>
                                </div>
                                <button className="contact-button">✓ Contactar</button>
                            </div>
                        </div>
                        <div className="load-more">
                            <FaChevronDown />
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

                </main>
            </div>

            {/* Modal del formulario de publicar problema */}
            <PublicarProblemaForm
                isOpen={showProblemaForm}
                onClose={handleCloseProblemaForm}
                onSubmit={handleProblemaSubmit}
            />

            </div>
        </>
    );
};

export default Dashboard;
