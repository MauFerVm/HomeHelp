import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import './adminGestion.css';
import { STATIC_URL, API_URL } from '../../../services/apiConfig';

const API = `${API_URL}/categories`;

const ESTADOS = [
    { id: 'todos', label: 'Todas' },
    { id: 'activas', label: 'Activas' },
    { id: 'inactivas', label: 'Inactivas' }
];

const normalizar = (valor) =>
    String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const Estado = ({ activo }) => (
    <span className={`adm-badge ${activo ? 'estado-activo' : 'estado-inactivo'}`}>
        {activo ? 'Activa' : 'Inactiva'}
    </span>
);

const imagenSrc = (imagen) => (
    imagen ? `${STATIC_URL}/uploads/categorias/${imagen}` : ''
);

const AdminCategorias = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState('todos');
    const [accionId, setAccionId] = useState(null);
    const [bajaPendiente, setBajaPendiente] = useState(null);
    const [edicion, setEdicion] = useState(null);
    const [nombre, setNombre] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [vistaPrevia, setVistaPrevia] = useState('');
    const [formError, setFormError] = useState('');
    const [aviso, setAviso] = useState('');

    const cargar = async () => {
        const response = await fetch(`${API}/gestion`);
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudieron obtener las categorías');
        }
        setItems(data.data || []);
    };

    useEffect(() => {
        let cancelado = false;

        const iniciar = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API}/gestion`);
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudieron obtener las categorías');
                }
                if (!cancelado) setItems(data.data || []);
            } catch (err) {
                if (!cancelado) {
                    setError(err.message || 'Error de conexión');
                    setItems([]);
                }
            } finally {
                if (!cancelado) setLoading(false);
            }
        };

        iniciar();
        return () => {
            cancelado = true;
        };
    }, []);

    const filtradas = useMemo(() => {
        const consulta = normalizar(busqueda);
        return items.filter((item) => {
            if (estado === 'activas' && !item.estado) return false;
            if (estado === 'inactivas' && item.estado) return false;
            if (!consulta) return true;
            return normalizar(item.nombre).includes(consulta);
        });
    }, [items, busqueda, estado]);

    const stats = useMemo(() => ([
        { label: 'Categorías', valor: items.length },
        { label: 'Activas', valor: items.filter((item) => item.estado).length },
        { label: 'Con profesionales', valor: items.filter((item) => item.profesionales > 0).length },
        { label: 'Solicitudes', valor: items.reduce((total, item) => total + item.solicitudes, 0) }
    ]), [items]);

    const cambiarEstado = async (item, activo) => {
        try {
            setAccionId(item.id);
            setAviso('');
            const response = await fetch(`${API}/${item.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: activo })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudo cambiar el estado');
            }
            setItems((previos) => previos.map((categoria) => (
                categoria.id === item.id ? { ...categoria, estado: activo } : categoria
            )));
            setBajaPendiente(null);
        } catch (err) {
            setAviso(err.message || 'No se pudo cambiar el estado');
        } finally {
            setAccionId(null);
        }
    };

    const limpiarImagen = () => {
        setArchivo(null);
        setVistaPrevia('');
    };

    const abrirAlta = () => {
        setFormError('');
        setNombre('');
        limpiarImagen();
        setEdicion({ id: null });
    };

    const abrirEdicion = (item) => {
        setFormError('');
        setNombre(item.nombre);
        limpiarImagen();
        setVistaPrevia(imagenSrc(item.imagen));
        setEdicion(item);
    };

    const elegirImagen = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setFormError('Solo se permiten archivos de imagen');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError('La imagen no puede superar los 5 MB');
            return;
        }
        setFormError('');
        setArchivo(file);
        setVistaPrevia(URL.createObjectURL(file));
    };

    const guardar = async (event) => {
        event.preventDefault();
        if (!edicion) return;

        const esAlta = edicion.id == null;
        try {
            setAccionId(edicion.id ?? 'alta');
            setFormError('');
            const cuerpo = new FormData();
            cuerpo.append('nombre', nombre.trim());
            if (archivo) cuerpo.append('imagen', archivo);
            const response = await fetch(esAlta ? API : `${API}/${edicion.id}`, {
                method: esAlta ? 'POST' : 'PUT',
                body: cuerpo
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudo guardar la categoría');
            }
            await cargar();
            setEdicion(null);
        } catch (err) {
            setFormError(err.message || 'No se pudo guardar la categoría');
        } finally {
            setAccionId(null);
        }
    };

    const etiqueta = filtradas.length === 1 ? '1 categoría' : `${filtradas.length} categorías`;

    return (
        <section className="adm-panel">
            <header className="adm-header">
                <div>
                    <h2>Categorías</h2>
                    <p>Rubros de la plataforma. Al crear o modificar podés cargar la imagen que se muestra en el home.</p>
                </div>
                <button type="button" className="adm-btn" onClick={abrirAlta}>
                    Nueva categoría
                </button>
            </header>

            <div className="adm-stats">
                {stats.map((stat) => (
                    <article key={stat.label} className="adm-stat">
                        <span>{stat.label}</span>
                        <strong>{stat.valor}</strong>
                    </article>
                ))}
            </div>

            <div className="adm-toolbar">
                <label className="adm-search">
                    <FaSearch />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                        placeholder="Buscar por nombre"
                        aria-label="Buscar categorías"
                    />
                </label>
                <div className="adm-filters" role="group" aria-label="Filtrar por estado">
                    {ESTADOS.map((opcion) => (
                        <button
                            key={opcion.id}
                            type="button"
                            className={`adm-chip-btn ${estado === opcion.id ? 'active' : ''}`}
                            onClick={() => setEstado(opcion.id)}
                        >
                            {opcion.label}
                        </button>
                    ))}
                </div>
                <span className="adm-count-label">{etiqueta}</span>
            </div>

            {aviso && <p className="adm-aviso">{aviso}</p>}

            {loading ? (
                <div className="adm-state">
                    <div className="adm-spinner" />
                    <p>Cargando categorías...</p>
                </div>
            ) : error ? (
                <div className="adm-state">
                    <p>{error}</p>
                    <button type="button" className="adm-retry" onClick={() => {
                        setError(null);
                        setLoading(true);
                        cargar()
                            .catch((err) => {
                                setError(err.message || 'Error de conexión');
                                setItems([]);
                            })
                            .finally(() => setLoading(false));
                    }}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Profesionales</th>
                                <th>Solicitudes</th>
                                <th>Estado</th>
                                <th>ABM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtradas.length === 0 ? (
                                <tr>
                                    <td className="adm-empty-cell" colSpan={5}>
                                        <div className="adm-empty">No hay categorías para esa búsqueda.</div>
                                    </td>
                                </tr>
                            ) : (
                                filtradas.map((item) => (
                                    <tr key={item.id}>
                                        <td className="adm-main-cell" data-label="">
                                            <div className="adm-person">
                                                {item.imagen ? (
                                                    <img src={imagenSrc(item.imagen)} alt="" className="adm-avatar" />
                                                ) : (
                                                    <span className="adm-avatar adm-avatar-letra" aria-hidden="true">
                                                        {item.nombre.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                                <strong>{item.nombre}</strong>
                                            </div>
                                        </td>
                                        <td data-label="Profesionales">
                                            <span className="adm-pill">{item.profesionales}</span>
                                        </td>
                                        <td data-label="Solicitudes">
                                            <span className="adm-pill">{item.solicitudes}</span>
                                        </td>
                                        <td data-label="Estado">
                                            <Estado activo={item.estado} />
                                        </td>
                                        <td data-label="ABM">
                                            <div className="adm-abm" role="group" aria-label={`ABM de ${item.nombre}`}>
                                                <button
                                                    type="button"
                                                    className="adm-casilla alta"
                                                    title={item.estado ? 'La categoría ya está activa' : 'Dar de alta'}
                                                    aria-label="Dar de alta"
                                                    disabled={item.estado || accionId === item.id}
                                                    onClick={() => cambiarEstado(item, true)}
                                                >
                                                    A
                                                </button>
                                                <button
                                                    type="button"
                                                    className="adm-casilla baja"
                                                    title={item.estado ? 'Dar de baja' : 'La categoría ya está inactiva'}
                                                    aria-label="Dar de baja"
                                                    disabled={!item.estado || accionId === item.id}
                                                    onClick={() => setBajaPendiente(item)}
                                                >
                                                    B
                                                </button>
                                                <button
                                                    type="button"
                                                    className="adm-casilla modificar"
                                                    title="Modificar"
                                                    aria-label="Modificar"
                                                    disabled={accionId === item.id}
                                                    onClick={() => abrirEdicion(item)}
                                                >
                                                    M
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {bajaPendiente && (
                <div className="adm-modal-overlay" onClick={() => accionId == null && setBajaPendiente(null)}>
                    <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="cat-baja-titulo" onClick={(event) => event.stopPropagation()}>
                        <h3 id="cat-baja-titulo">Dar de baja</h3>
                        <p>
                            {bajaPendiente.nombre} deja de aparecer en el home y en los registros nuevos. Las solicitudes ya publicadas se conservan.
                        </p>
                        <div className="adm-modal-actions">
                            <button type="button" className="adm-btn ghost" onClick={() => setBajaPendiente(null)} disabled={accionId != null}>
                                Cancelar
                            </button>
                            <button type="button" className="adm-btn danger" onClick={() => cambiarEstado(bajaPendiente, false)} disabled={accionId != null}>
                                {accionId != null ? 'Guardando...' : 'Dar de baja'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {edicion && (
                <div className="adm-modal-overlay" onClick={() => accionId == null && setEdicion(null)}>
                    <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="cat-form-titulo" onClick={(event) => event.stopPropagation()}>
                        <h3 id="cat-form-titulo">{edicion.id == null ? 'Nueva categoría' : 'Modificar categoría'}</h3>
                        <form className="adm-form" onSubmit={guardar}>
                            <label>
                                Nombre
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(event) => setNombre(event.target.value)}
                                    required
                                    minLength={2}
                                    maxLength={100}
                                    autoFocus
                                />
                            </label>
                            <label>
                                Imagen
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={elegirImagen}
                                />
                            </label>
                            {vistaPrevia ? (
                                <img src={vistaPrevia} alt="Vista previa" className="adm-preview" />
                            ) : (
                                <p className="adm-muted">
                                    {edicion.id == null
                                        ? 'Podés subir una foto ahora o dejarla para después.'
                                        : 'Si no elegís una foto, se mantiene la actual.'}
                                </p>
                            )}
                            {formError && <p className="adm-form-error">{formError}</p>}
                            <div className="adm-modal-actions">
                                <button type="button" className="adm-btn ghost" onClick={() => setEdicion(null)} disabled={accionId != null}>
                                    Cancelar
                                </button>
                                <button type="submit" className="adm-btn" disabled={accionId != null}>
                                    {accionId != null ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminCategorias;
