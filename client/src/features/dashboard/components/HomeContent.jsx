import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import perfil from '../../../assets/user.png';
import './HomeContent.css';

const HomeContent = ({
    categories = [],
    loadingCategories = false,
    userType,
    onOpenProblemaForm
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(4);
    const [carouselGap, setCarouselGap] = useState(24);
    const carouselRef = useRef(null);
    const [carouselWidth, setCarouselWidth] = useState(0);

    const [featuredProfessionals, setFeaturedProfessionals] = useState([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

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

    const fetchFeaturedProfessionals = async (tipoProfesionalId = null) => {
        try {
            setLoadingProfessionals(true);
            const params = new URLSearchParams();
            if (tipoProfesionalId) {
                params.set('tipo_profesional_id', String(tipoProfesionalId));
            }
            const query = params.toString();
            const response = await fetch(
                `http://localhost:3002/api/calificaciones/destacados${query ? `?${query}` : ''}`
            );
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

    useEffect(() => {
        if (userType === 'admin') return;
        fetchFeaturedProfessionals(selectedCategoryId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId, userType]);

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
    }, [loadingCategories]);

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

    const canGoNext = true;
    const canGoPrev = true;

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Búsqueda:', searchQuery);
    };

    return (
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
                                onClick={onOpenProblemaForm}
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
                {loadingCategories ? (
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
                <div className="category-filters" role="group" aria-label="Filtrar profesionales por categoría">
                    <button
                        type="button"
                        className={`category-filter-chip ${selectedCategoryId == null ? 'active' : ''}`}
                        onClick={() => setSelectedCategoryId(null)}
                    >
                        Todas
                    </button>
                    {categories
                        .filter((category) => category.id != null)
                        .map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                className={`category-filter-chip ${selectedCategoryId === category.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategoryId(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                </div>
                <div className="professionals-list">
                    {loadingProfessionals ? (
                        <p className="professionals-status">Cargando profesionales...</p>
                    ) : featuredProfessionals.length === 0 ? (
                        <p className="professionals-status">
                            {selectedCategoryId
                                ? 'No hay profesionales calificados en esta categoría.'
                                : 'No hay profesionales calificados aún.'}
                        </p>
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
};

export default HomeContent;

