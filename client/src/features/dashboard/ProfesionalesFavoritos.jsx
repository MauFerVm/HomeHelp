import React, { useEffect, useState } from 'react';
import { FaHeart, FaSpinner } from 'react-icons/fa';
import './ProfesionalesFavoritos.css';
import perfil from '../../assets/user.png';

const ProfesionalesFavoritos = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [favoritos, setFavoritos] = useState([]);

    useEffect(() => {
        const cargarFavoritos = async () => {
            try {
                setLoading(true);
                setError('');

                const storedUserData = localStorage.getItem('userData');
                if (!storedUserData) {
                    throw new Error('No se encontró la sesión del cliente');
                }

                const userData = JSON.parse(storedUserData);
                const personaResponse = await fetch(`http://localhost:3002/api/auth/persona/${userData.id}`);
                const personaData = await personaResponse.json();

                if (!personaData.success || !personaData.data?.id) {
                    throw new Error('No se pudo identificar al cliente');
                }

                const response = await fetch(`http://localhost:3002/api/favoritos/cliente/${personaData.data.id}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'No se pudieron cargar los favoritos');
                }

                setFavoritos(data.data || []);
            } catch (err) {
                console.error('Error al cargar profesionales favoritos:', err);
                setError(err.message || 'No se pudieron cargar los favoritos');
            } finally {
                setLoading(false);
            }
        };

        cargarFavoritos();
    }, []);

    const getFoto = (fotoPerfil) => {
        if (fotoPerfil) {
            return `http://localhost:3002/uploads/profiles/${fotoPerfil}`;
        }
        return perfil;
    };

    const formatFecha = (fecha) => {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="favoritos-page">
            <div className="favoritos-header">
                <h2>Profesionales favoritos</h2>
                <p>Los profesionales que guardaste después de un servicio calificado.</p>
            </div>

            {loading && (
                <div className="favoritos-estado">
                    <FaSpinner className="favoritos-spinner" />
                    <p>Cargando favoritos...</p>
                </div>
            )}

            {!loading && error && (
                <p className="favoritos-estado">{error}</p>
            )}

            {!loading && !error && favoritos.length === 0 && (
                <div className="favoritos-estado">
                    <FaHeart className="favoritos-vacio-icon" />
                    <p>Aún no agregaste profesionales a favoritos.</p>
                </div>
            )}

            {!loading && !error && favoritos.length > 0 && (
                <div className="favoritos-list">
                    {favoritos.map((favorito) => (
                        <article key={favorito.id} className="favorito-card">
                            <img
                                src={getFoto(favorito.foto_perfil)}
                                alt={favorito.nombre_apellido}
                                className="favorito-foto"
                            />
                            <div className="favorito-info">
                                <h3>{favorito.nombre_apellido}</h3>
                                <p>{favorito.tipo_profesional_nombre || 'Profesional'}</p>
                                <p>
                                    {favorito.promedio_calificacion
                                        ? `★ ${favorito.promedio_calificacion} (${favorito.total_calificaciones} calificaciones)`
                                        : 'Sin calificaciones'}
                                </p>
                                <p className="favorito-fecha">Agregado el {formatFecha(favorito.creado_en)}</p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfesionalesFavoritos;
