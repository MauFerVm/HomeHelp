import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FaSearch, FaStar } from 'react-icons/fa';
import perfil from '../../../assets/user.png';
import './adminGestion.css';
import { STATIC_URL, API_URL } from '../../../services/apiConfig';

const API = `${API_URL}/admin`;

const ESTADOS = [
    { id: 'todos', label: 'Todos' },
    { id: 'activos', label: 'Activos' },
    { id: 'inactivos', label: 'Inactivos' }
];

const ROL_LABEL = {
    admin: 'Administrador',
    cliente: 'Cliente',
    profesional: 'Profesional'
};

const normalizar = (valor) =>
    String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const formatFecha = (valor) => {
    if (!valor) return '—';
    const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
    if (!anio || !mes || !dia) return '—';
    return `${dia}/${mes}/${anio}`;
};

const formatNota = (valor) =>
    Number(valor).toLocaleString('es-AR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

const fotoSrc = (foto) =>
    foto ? `${STATIC_URL}/uploads/profiles/${foto}` : perfil;

const nombreVisible = (item) => item.nombre_apellido || item.nombre_usuario || 'Sin nombre';

const Persona = ({ item }) => (
    <div className="adm-person">
        <img
            src={fotoSrc(item.foto_perfil)}
            alt=""
            className="adm-avatar"
            onError={(event) => {
                event.currentTarget.src = perfil;
            }}
        />
        <div className="adm-person-text">
            <strong>{nombreVisible(item)}</strong>
            <span>@{item.nombre_usuario}</span>
            <span>{item.correo}</span>
        </div>
    </div>
);

const Estado = ({ activo }) => (
    <span className={`adm-badge ${activo ? 'estado-activo' : 'estado-inactivo'}`}>
        {activo ? 'Activo' : 'Inactivo'}
    </span>
);

const AccionesAbm = ({ item, sesionId, ocupado, onAlta, onBaja, onModificar }) => {
    const esPropiaCuenta = item.id === sesionId;

    return (
        <div className="adm-abm" role="group" aria-label={`ABM de ${nombreVisible(item)}`}>
            <button
                type="button"
                className="adm-casilla alta"
                title={item.activo ? 'La cuenta ya está activa' : 'Dar de alta'}
                aria-label="Dar de alta"
                disabled={item.activo || ocupado}
                onClick={() => onAlta(item)}
            >
                A
            </button>
            <button
                type="button"
                className="adm-casilla baja"
                title={esPropiaCuenta ? 'No podés dar de baja tu propia cuenta' : item.activo ? 'Dar de baja' : 'La cuenta ya está inactiva'}
                aria-label="Dar de baja"
                disabled={!item.activo || esPropiaCuenta || ocupado}
                onClick={() => onBaja(item)}
            >
                B
            </button>
            <button
                type="button"
                className="adm-casilla modificar"
                title="Modificar"
                aria-label="Modificar"
                disabled={ocupado}
                onClick={() => onModificar(item)}
            >
                M
            </button>
        </div>
    );
};

const Estrellas = ({ valor, resenas }) => {
    if (valor == null) {
        return <span className="adm-muted">Sin reseñas</span>;
    }

    const redondeado = Math.round(valor);

    return (
        <span className="adm-rating" aria-label={`${formatNota(valor)} de 5, ${resenas} reseñas`}>
            {[1, 2, 3, 4, 5].map((estrella) => (
                <FaStar key={estrella} className={estrella <= redondeado ? 'on' : 'off'} />
            ))}
            <span>{formatNota(valor)}</span>
        </span>
    );
};

const Zona = ({ localidad, provincia, direccion }) => {
    if (!localidad && !direccion) {
        return <span className="adm-muted">Sin domicilio</span>;
    }

    return (
        <div className="adm-zona">
            {direccion && <strong>{direccion}</strong>}
            <span className="adm-muted">
                {[localidad, provincia].filter(Boolean).join(', ') || '—'}
            </span>
        </div>
    );
};

const coincideBusqueda = (item, busqueda, campos) => {
    if (!busqueda) return true;
    const consulta = normalizar(busqueda);
    return campos.some((campo) => normalizar(item[campo]).includes(consulta));
};

const coincideEstado = (item, estado) => {
    if (estado === 'activos') return item.activo;
    if (estado === 'inactivos') return !item.activo;
    return true;
};

const promedioCalificacion = (items) => {
    const conNota = items.filter((item) => item.calificacion != null);
    if (conNota.length === 0) return null;
    const total = conNota.reduce((acumulado, item) => acumulado + item.calificacion, 0);
    return total / conNota.length;
};

const AdminGestion = ({ vista }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState('todos');
    const [filtroExtra, setFiltroExtra] = useState('todos');
    const [reloadKey, setReloadKey] = useState(0);
    const [accionId, setAccionId] = useState(null);
    const [bajaPendiente, setBajaPendiente] = useState(null);
    const [edicion, setEdicion] = useState(null);
    const [form, setForm] = useState({ correo: '', nombre_usuario: '', nombre_apellido: '' });
    const [formError, setFormError] = useState('');
    const [aviso, setAviso] = useState('');
    const { user } = useAuth();
    const sesionId = user?.id ?? null;

    useEffect(() => {
        let cancelado = false;

        const cargar = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API}/${vista}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo cargar la información');
                }

                if (!cancelado) {
                    setItems(data.data || []);
                }
            } catch (err) {
                if (!cancelado) {
                    setError(err.message || 'Error de conexión');
                    setItems([]);
                }
            } finally {
                if (!cancelado) {
                    setLoading(false);
                }
            }
        };

        setBusqueda('');
        setEstado('todos');
        setFiltroExtra('todos');
        cargar();

        return () => {
            cancelado = true;
        };
    }, [vista, reloadKey]);

    const actualizarItem = (id, cambios) => {
        setItems((previos) => previos.map((item) => (
            item.id === id ? { ...item, ...cambios } : item
        )));
    };

    const cambiarEstado = async (item, activo) => {
        try {
            setAccionId(item.id);
            setAviso('');
            const response = await fetch(`${API}/usuarios/${item.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activo })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudo cambiar el estado');
            }
            actualizarItem(item.id, { activo });
            setBajaPendiente(null);
        } catch (err) {
            setAviso(err.message || 'No se pudo cambiar el estado');
        } finally {
            setAccionId(null);
        }
    };

    const abrirEdicion = (item) => {
        setFormError('');
        setEdicion(item);
        setForm({
            correo: item.correo || '',
            nombre_usuario: item.nombre_usuario || '',
            nombre_apellido: item.nombre_apellido || ''
        });
    };

    const guardarEdicion = async (event) => {
        event.preventDefault();
        if (!edicion) return;

        try {
            setAccionId(edicion.id);
            setFormError('');
            const response = await fetch(`${API}/usuarios/${edicion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo: form.correo.trim(),
                    nombre_usuario: form.nombre_usuario.trim(),
                    nombre_apellido: edicion.persona_id ? form.nombre_apellido.trim() : null
                })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'No se pudo modificar el usuario');
            }
            actualizarItem(edicion.id, {
                correo: form.correo.trim(),
                nombre_usuario: form.nombre_usuario.trim(),
                ...(edicion.persona_id ? { nombre_apellido: form.nombre_apellido.trim() } : {})
            });
            setEdicion(null);
        } catch (err) {
            setFormError(err.message || 'No se pudo modificar el usuario');
        } finally {
            setAccionId(null);
        }
    };

    const opcionesExtra = useMemo(() => {
        if (vista === 'clientes') {
            const localidades = [...new Set(items.map((item) => item.localidad).filter(Boolean))].sort((a, b) =>
                a.localeCompare(b, 'es')
            );
            return localidades;
        }

        if (vista === 'profesionales') {
            const rubros = [...new Set(items.flatMap((item) => item.categorias || []))].sort((a, b) =>
                a.localeCompare(b, 'es')
            );
            return rubros;
        }

        return [];
    }, [items, vista]);

    const filtrados = useMemo(() => {
        return items.filter((item) => {
            if (!coincideEstado(item, estado)) return false;

            if (vista === 'usuarios') {
                if (filtroExtra !== 'todos' && item.rol !== filtroExtra) return false;
                return coincideBusqueda(item, busqueda, ['nombre_apellido', 'nombre_usuario', 'correo', 'rol']);
            }

            if (vista === 'clientes') {
                if (filtroExtra !== 'todos' && item.localidad !== filtroExtra) return false;
                return coincideBusqueda(item, busqueda, [
                    'nombre_apellido',
                    'nombre_usuario',
                    'correo',
                    'direccion',
                    'localidad',
                    'provincia'
                ]);
            }

            if (filtroExtra !== 'todos' && !(item.categorias || []).includes(filtroExtra)) return false;
            const rubros = (item.categorias || []).join(' ');
            const consulta = normalizar(busqueda);
            if (!consulta) return true;
            return (
                coincideBusqueda(item, busqueda, [
                    'nombre_apellido',
                    'nombre_usuario',
                    'correo',
                    'localidad',
                    'provincia',
                    'presentacion'
                ]) || normalizar(rubros).includes(consulta)
            );
        });
    }, [items, busqueda, estado, filtroExtra, vista]);

    const stats = useMemo(() => {
        const activos = items.filter((item) => item.activo).length;

        if (vista === 'usuarios') {
            return [
                { label: 'Usuarios', valor: items.length },
                { label: 'Clientes', valor: items.filter((item) => item.rol === 'cliente').length },
                { label: 'Profesionales', valor: items.filter((item) => item.rol === 'profesional').length },
                { label: 'Administradores', valor: items.filter((item) => item.rol === 'admin').length }
            ];
        }

        if (vista === 'clientes') {
            const media = promedioCalificacion(items);
            return [
                { label: 'Clientes', valor: items.length },
                { label: 'Activos', valor: activos },
                { label: 'Calificación', valor: media == null ? '—' : formatNota(media) },
                { label: 'Solicitudes', valor: items.reduce((total, item) => total + item.solicitudes, 0) }
            ];
        }

        const media = promedioCalificacion(items);
        return [
            { label: 'Profesionales', valor: items.length },
            { label: 'Activos', valor: activos },
            { label: 'Calificación', valor: media == null ? '—' : formatNota(media) },
            { label: 'Trabajos', valor: items.reduce((total, item) => total + item.trabajos, 0) }
        ];
    }, [items, vista]);

    const titulo = vista === 'usuarios' ? 'Usuarios' : vista === 'clientes' ? 'Clientes' : 'Profesionales';
    const descripcion =
        vista === 'usuarios'
            ? 'Junto a la fecha de registro: A da de alta, B da de baja y M modifica.'
            : vista === 'clientes'
                ? 'Hogares que publican problemas, con domicilio, actividad y calificación.'
                : 'Oficios, zona de trabajo, calificación y trabajos tomados.';

    const singular = { usuarios: 'usuario', clientes: 'cliente', profesionales: 'profesional' };
    const etiquetaResultados =
        filtrados.length === 1
            ? `1 ${singular[vista]}`
            : `${filtrados.length} ${titulo.toLowerCase()}`;

    const renderFila = (item) => {
        if (vista === 'usuarios') {
            return (
                <tr key={item.id}>
                    <td className="adm-main-cell" data-label="">
                        <Persona item={item} />
                    </td>
                    <td data-label="Rol">
                        <span className={`adm-badge rol-${item.rol}`}>{ROL_LABEL[item.rol] || item.rol}</span>
                    </td>
                    <td data-label="Estado">
                        <Estado activo={item.activo} />
                    </td>
                    <td data-label="Registro">{formatFecha(item.fecha_creacion)}</td>
                    <td data-label="ABM">
                        <AccionesAbm
                            item={item}
                            sesionId={sesionId}
                            ocupado={accionId === item.id}
                            onAlta={(usuario) => cambiarEstado(usuario, true)}
                            onBaja={setBajaPendiente}
                            onModificar={abrirEdicion}
                        />
                    </td>
                </tr>
            );
        }

        if (vista === 'clientes') {
            return (
                <tr key={item.id}>
                    <td className="adm-main-cell" data-label="">
                        <Persona item={item} />
                    </td>
                    <td data-label="Domicilio">
                        <Zona localidad={item.localidad} provincia={item.provincia} direccion={item.direccion} />
                    </td>
                    <td data-label="Solicitudes">
                        <span className="adm-pill">{item.solicitudes}</span>
                    </td>
                    <td data-label="Órdenes">
                        <span className="adm-pill">{item.ordenes}</span>
                    </td>
                    <td data-label="Calificación">
                        <Estrellas valor={item.calificacion} resenas={item.resenas} />
                    </td>
                    <td data-label="Estado">
                        <Estado activo={item.activo} />
                    </td>
                </tr>
            );
        }

        return (
            <tr key={item.id}>
                <td className="adm-main-cell" data-label="">
                    <Persona item={item} />
                </td>
                <td data-label="Rubros">
                    {item.categorias?.length ? (
                        <div className="adm-chips">
                            {item.categorias.map((rubro) => (
                                <span key={rubro} className="adm-chip">{rubro}</span>
                            ))}
                        </div>
                    ) : (
                        <span className="adm-muted">Sin rubro</span>
                    )}
                </td>
                <td data-label="Zona">
                    <Zona localidad={item.localidad} provincia={item.provincia} />
                </td>
                <td data-label="Calificación">
                    <Estrellas valor={item.calificacion} resenas={item.resenas} />
                </td>
                <td data-label="Trabajos">
                    <span className="adm-pill">{item.trabajos}</span>
                </td>
                <td data-label="Estado">
                    <Estado activo={item.activo} />
                </td>
            </tr>
        );
    };

    const columnas =
        vista === 'usuarios'
            ? ['Persona', 'Rol', 'Estado', 'Registro', 'ABM']
            : vista === 'clientes'
                ? ['Cliente', 'Domicilio', 'Solicitudes', 'Órdenes', 'Calificación', 'Estado']
                : ['Profesional', 'Rubros', 'Zona', 'Calificación', 'Trabajos', 'Estado'];

    return (
        <section className="adm-panel">
            <header className="adm-header">
                <div>
                    <h2>{titulo}</h2>
                    <p>{descripcion}</p>
                </div>
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
                        placeholder={
                            vista === 'usuarios'
                                ? 'Buscar por nombre, usuario o correo'
                                : vista === 'clientes'
                                    ? 'Buscar por nombre, correo o dirección'
                                    : 'Buscar por nombre, rubro o zona'
                        }
                        aria-label={`Buscar ${titulo.toLowerCase()}`}
                    />
                </label>

                {vista === 'usuarios' && (
                    <select
                        className="adm-select"
                        value={filtroExtra}
                        onChange={(event) => setFiltroExtra(event.target.value)}
                        aria-label="Filtrar por rol"
                    >
                        <option value="todos">Todos los roles</option>
                        <option value="cliente">Clientes</option>
                        <option value="profesional">Profesionales</option>
                        <option value="admin">Administradores</option>
                    </select>
                )}

                {vista === 'clientes' && (
                    <select
                        className="adm-select"
                        value={filtroExtra}
                        onChange={(event) => setFiltroExtra(event.target.value)}
                        aria-label="Filtrar por localidad"
                    >
                        <option value="todos">Todas las localidades</option>
                        {opcionesExtra.map((localidad) => (
                            <option key={localidad} value={localidad}>{localidad}</option>
                        ))}
                    </select>
                )}

                {vista === 'profesionales' && (
                    <select
                        className="adm-select"
                        value={filtroExtra}
                        onChange={(event) => setFiltroExtra(event.target.value)}
                        aria-label="Filtrar por rubro"
                    >
                        <option value="todos">Todos los rubros</option>
                        {opcionesExtra.map((rubro) => (
                            <option key={rubro} value={rubro}>{rubro}</option>
                        ))}
                    </select>
                )}

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

                <span className="adm-count-label">{etiquetaResultados}</span>
            </div>

            {aviso && <p className="adm-aviso">{aviso}</p>}

            {loading ? (
                <div className="adm-state">
                    <div className="adm-spinner" />
                    <p>Cargando {titulo.toLowerCase()}...</p>
                </div>
            ) : error ? (
                <div className="adm-state">
                    <p>{error}</p>
                    <button type="button" className="adm-retry" onClick={() => setReloadKey((valor) => valor + 1)}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className="adm-table-wrap">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                {columnas.map((columna) => (
                                    <th key={columna}>{columna}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.length === 0 ? (
                                <tr>
                                    <td className="adm-empty-cell" colSpan={columnas.length}>
                                        <div className="adm-empty">No hay resultados para esa búsqueda.</div>
                                    </td>
                                </tr>
                            ) : (
                                filtrados.map(renderFila)
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {bajaPendiente && (
                <div className="adm-modal-overlay" onClick={() => accionId == null && setBajaPendiente(null)}>
                    <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-baja-titulo" onClick={(event) => event.stopPropagation()}>
                        <h3 id="adm-baja-titulo">Dar de baja</h3>
                        <p>
                            {nombreVisible(bajaPendiente)} va a quedar inactivo y no podrá ingresar hasta que lo des de alta de nuevo.
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
                    <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-edit-titulo" onClick={(event) => event.stopPropagation()}>
                        <h3 id="adm-edit-titulo">Modificar usuario</h3>
                        <p className="adm-muted">{ROL_LABEL[edicion.rol] || edicion.rol}</p>
                        <form className="adm-form" onSubmit={guardarEdicion}>
                            {edicion.persona_id && (
                                <label>
                                    Nombre y apellido
                                    <input
                                        type="text"
                                        value={form.nombre_apellido}
                                        onChange={(event) => setForm((previo) => ({ ...previo, nombre_apellido: event.target.value }))}
                                        required
                                        maxLength={100}
                                    />
                                </label>
                            )}
                            <label>
                                Usuario
                                <input
                                    type="text"
                                    value={form.nombre_usuario}
                                    onChange={(event) => setForm((previo) => ({ ...previo, nombre_usuario: event.target.value }))}
                                    required
                                    minLength={3}
                                    maxLength={50}
                                />
                            </label>
                            <label>
                                Correo
                                <input
                                    type="email"
                                    value={form.correo}
                                    onChange={(event) => setForm((previo) => ({ ...previo, correo: event.target.value }))}
                                    required
                                    maxLength={100}
                                />
                            </label>
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

export default AdminGestion;
