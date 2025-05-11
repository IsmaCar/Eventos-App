import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
const API_URL = import.meta.env.VITE_API_URL;

function Dashboard() {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(null);
    const [checked, setChecked] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        photos: 0,
    });
    // Estados para controlar qué panel está activo
    const [activePanel, setActivePanel] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [eventsList, setEventsList] = useState([]);
    const [reportsList, setReportsList] = useState([]);
    const [usersPagination, setUsersPagination] = useState({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
    })
    const [eventsPagination, setEventsPagination] = useState({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
    })

    const handleUserPageChange = (newPage) => {
        if (newPage < 1 || newPage > usersPagination.totalPages) return;
        fetchUsers(newPage);
    };

    // Cambiar de página en la lista de eventos
    const handleEventPageChange = (newPage) => {
        if (newPage < 1 || newPage > eventsPagination.totalPages) return;
        fetchEvents(newPage);
    };

    // Verificar usuario y rol de admin cuando el componente se monta
    useEffect(() => {
        console.log("Dashboard - Verificando autenticación...");
        console.log("Usuario:", user);
        console.log("Token:", token ? "Presente" : "No presente");

        const checkAdmin = () => {
            try {
                if (user && user.roles) {
                    const hasAdminRole = user.roles.includes('ROLE_ADMIN');
                    console.log("Roles del usuario:", user.roles);
                    console.log("¿Es admin?", hasAdminRole);
                    setIsAdmin(hasAdminRole);
                } else {
                    console.log("Usuario sin roles o no autenticado");
                    setIsAdmin(false);
                }

                // Siempre marcar la verificación como completada
                setChecked(true);
                setLoading(false);
            } catch (err) {
                console.error("Error verificando rol:", err);
                setError("Error verificando permisos");
                setIsAdmin(false);
                setChecked(true);
                setLoading(false);
            }
        };

        // Pequeña demora para asegurar que useAuth ha terminado
        const timer = setTimeout(() => {
            checkAdmin();
        }, 100);

        return () => clearTimeout(timer);
    }, [user]);

    // Cargar estadísticas si el usuario es admin
    useEffect(() => {
        if (isAdmin && token) {
            console.log("Cargando estadísticas para admin...");
            fetchStats();
        }
    }, [isAdmin, token]);

    // Función para cargar estadísticas
    const fetchStats = async () => {
        try {
            console.log("Solicitando estadísticas a:", `${API_URL}/api/admin/stats`);
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            console.log("Respuesta status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error en respuesta:", errorText);
                throw new Error('Error al cargar estadísticas');
            }

            const data = await response.json();
            console.log("Datos recibidos:", data);

            setStats({
                users: data.users?.total || 0,
                events: data.events?.total || 0,
                photos: data.photos?.total || 0,
            });
        } catch (error) {
            console.error("Error obteniendo estadísticas:", error);
            setError('Error al cargar estadísticas');
        }
    };

    // Función para cambiar entre paneles
    const togglePanel = (panel) => {
        if (activePanel === panel) {
            setActivePanel(null); // Si ya está abierto, lo cerramos
        } else {
            setActivePanel(panel); // Si no, abrimos el nuevo panel

            // Cargar datos específicos según el panel seleccionado
            if (panel === 'users' && usersList.length === 0) {
                fetchUsers(usersPagination.currentPage);
            } else if (panel === 'events' && eventsList.length === 0) {
                fetchEvents(eventsPagination.currentPage);
            } else if (panel === 'reports' && reportsList.length === 0) {
                fetchReports();
            }
        }
    };

    // Función para cargar usuarios
    const fetchUsers = async (page = 1) => {
        try {
            console.log("Solicitando lista de usuarios...");
            const response = await fetch(`${API_URL}/api/admin/manage?page=${page}&limit=${usersPagination.itemsPerPage}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error cargando usuarios:", errorText);
                throw new Error('Error al cargar usuarios');
            }

            const data = await response.json();
            console.log("Datos de usuarios recibidos:", data.users);
            setUsersList(data.users || []);

            setUsersPagination({
            ...usersPagination,
            currentPage: page,
            totalItems: data.pagination?.totalItems.users ,
            totalPages: data.pagination?.totalPages.users
        });
        } catch (error) {
            console.error("Error obteniendo usuarios:", error);
            setError('Error al cargar la lista de usuarios');
        }
    };

    // Función para cargar eventos
    const fetchEvents = async (page = 1) => {
        try {
            console.log("Solicitando lista de eventos...");
            const response = await fetch(`${API_URL}/api/admin/manage?page=${page}&limit=${eventsPagination.itemsPerPage}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error cargando eventos:", errorText);
                throw new Error('Error al cargar eventos');
            }

            const data = await response.json();
            console.log("Datos de eventos recibidos:", data.events);
            setEventsList(data.events || []);

            setEventsPagination({
                ...eventsPagination,
                currentPage: page,
                totalItems: data.pagination?.totalItems.events,
                totalPages: data.pagination?.totalPages.events
            });
        } catch (error) {
            console.error("Error obteniendo eventos:", error);
            setError('Error al cargar la lista de eventos');
        }
    };

    const toggleUserActive = async (userId, currentlyActive) => {
        try {
            console.log(`Cambiando estado de usuario ${userId} a ${!currentlyActive ? 'activo' : 'bloqueado'}...`);

            const response = await fetch(`${API_URL}/api/admin/user/${userId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ banned: !currentlyActive })
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            // Actualizar la lista de usuarios con el nuevo estado
            setUsersList(usersList.map(user =>
                user.id === userId
                    ? { ...user, banned: !currentlyActive }
                    : user
            ));

        } catch (error) {
            console.error("Error al cambiar estado del usuario:", error);
            setError(`Error al cambiar estado del usuario: ${error.message}`);
        }
    };

    const toggleEventActive = async (eventId, currentlyBanned) => {
        try {
            const newBannedStatus = !currentlyBanned;

            console.log(`Evento ${eventId}: actualmente está ${currentlyBanned ? 'BLOQUEADO' : 'ACTIVO'}`);
            console.log(`Cambiando a: ${newBannedStatus ? 'BLOQUEADO' : 'ACTIVO'}`);

            const response = await fetch(`${API_URL}/api/admin/event/${eventId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ banned: newBannedStatus })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Error en respuesta:", errorData);
                throw new Error(`Error al cambiar estado (${response.status})`);
            }

            const data = await response.json();
            console.log("Respuesta del servidor:", data);

            // Actualizar la lista de eventos con el nuevo estado
            setEventsList(eventsList.map(event =>
                event.id === eventId
                    ? { ...event, banned: newBannedStatus }
                    : event
            ));

        } catch (error) {
            console.error("Error al cambiar estado del evento:", error);
            setError(`Error al cambiar estado del evento: ${error.message}`);
        }
    };

    // Función para cargar reportes (ejemplo simulado)
    const fetchReports = async () => {
        try {
            // Esta es una simulación de reportes, ya que parece que no tienes un endpoint para esto todavía
            // Reemplaza esto con una llamada real a la API cuando la implementes
            setReportsList([
                { id: 1, type: 'Evento inapropiado', status: 'Pendiente', date: '2023-05-01' },
                { id: 2, type: 'Usuario spam', status: 'Revisado', date: '2023-05-02' },
                { id: 3, type: 'Contenido ofensivo', status: 'Resuelto', date: '2023-05-03' }
            ]);
        } catch (error) {
            console.error("Error obteniendo reportes:", error);
            setError('Error al cargar la lista de reportes');
        }
    };

    // Si está cargando, mostrar spinner
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-3">Verificando permisos...</p>
            </div>
        );
    }

    // Si no es admin después de verificar, redirigir
    if (checked && !isAdmin) {
        console.log("No es administrador, redirigiendo...");
        return <Navigate to="/" replace />;
    }

    // Solo renderiza el dashboard si hemos verificado y ES admin
    if (checked && isAdmin === true) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <header className="bg-white shadow-md rounded-lg p-6 mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
                    </header>

                    {/* Mensaje de error si existe */}
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Tarjetas de estadísticas */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Usuarios</h2>
                            <p className="text-3xl font-bold">{stats.users || 0}</p>
                            <p className="text-sm mt-2 opacity-80">Total de usuarios registrados</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Eventos</h2>
                            <p className="text-3xl font-bold">{stats.events || 0}</p>
                            <p className="text-sm mt-2 opacity-80">Eventos publicados</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-2">Fotos</h2>
                            <p className="text-3xl font-bold">{stats.photos || 0}</p>
                            <p className="text-sm mt-2 opacity-80">Fotos compartidas</p>
                        </div>
                    </div>

                    {/* Sección de acciones rápidas */}
                    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones rápidas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <button
                                className={`transition px-4 py-3 rounded-lg font-medium
                                    ${activePanel === 'users'
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
                                onClick={() => togglePanel('users')}
                            >
                                Gestionar Usuarios
                            </button>
                            <button
                                className={`transition px-4 py-3 rounded-lg font-medium
                                    ${activePanel === 'events'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                                onClick={() => togglePanel('events')}
                            >
                                Gestionar Eventos
                            </button>
                            <button
                                className={`transition px-4 py-3 rounded-lg font-medium
                                    ${activePanel === 'reports'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                                onClick={() => togglePanel('reports')}
                            >
                                Revisar Reportes
                            </button>
                            <button
                                className={`transition px-4 py-3 rounded-lg font-medium
                                    ${activePanel === 'settings'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                                onClick={() => togglePanel('settings')}
                            >
                                Configuración
                            </button>
                        </div>
                    </div>

                    {/* Paneles dinámicos según la selección */}
                    {activePanel === 'users' && (
                        <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-fadeIn">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Gestión de Usuarios</h3>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>

                            {usersList.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white">
                                            <thead>
                                                <tr className="bg-gray-100 border-b">
                                                    <th className="py-2 px-4 text-left">ID</th>
                                                    <th className="py-2 px-4 text-left">Usuario</th>
                                                    <th className="py-2 px-4 text-left">Email</th>
                                                    <th className="py-2 px-4 text-left">Rol</th>
                                                    <th className="py-2 px-4 text-left">Estado</th>
                                                    <th className="py-2 px-4 text-left">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersList.map(user => (
                                                    <tr key={user.id} className="border-b hover:bg-gray-50">
                                                        <td className="py-2 px-4">{user.id}</td>
                                                        <td className="py-2 px-4">{user.username}</td>
                                                        <td className="py-2 px-4">{user.email}</td>
                                                        <td className="py-2 px-4">
                                                            {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'Usuario'}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.banned !== false
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {user.banned ? 'Bloqueado' : 'Activo'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <Link to={`/profile/${user.id}`} className="text-blue-500 hover:underline mr-2">Ver</Link>
                                                            <button
                                                                onClick={() => toggleUserActive(user.id, user.banned !== false)}
                                                                className={`${user.banned !== false
                                                                    ? 'text-green-500 hover:text-green-700'
                                                                    : 'text-red-500 hover:text-red-700'
                                                                    } hover:underline`}
                                                            >
                                                                {user.banned ? 'Activar' : 'Bloquear'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Componente de paginación */}
                                    <Pagination
                                        currentPage={usersPagination.currentPage}
                                        totalPages={usersPagination.totalPages}
                                        onPageChange={handleUserPageChange}
                                    />

                                    {/* Información sobre resultados */}
                                    <div className="text-sm text-gray-500 text-center mt-2">
                                        Mostrando {usersList.length} de {usersPagination.totalItems} usuarios
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Cargando usuarios...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activePanel === 'events' && (
                        <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-fadeIn">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Gestión de Eventos</h3>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>

                            {eventsList.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white">
                                            <thead>
                                                <tr className="bg-gray-100 border-b">
                                                    <th className="py-2 px-4 text-left">ID</th>
                                                    <th className="py-2 px-4 text-left">Título</th>
                                                    <th className="py-2 px-4 text-left">Fecha</th>
                                                    <th className="py-2 px-4 text-left">Creador</th>
                                                    <th className="py-2 px-4 text-left">Estado</th>
                                                    <th className="py-2 px-4 text-left">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {eventsList.map(event => (
                                                    <tr key={event.id} className="border-b hover:bg-gray-50">
                                                        <td className="py-2 px-4">{event.id}</td>
                                                        <td className="py-2 px-4">{event.title}</td>
                                                        <td className="py-2 px-4">{event.event_date}</td>
                                                        <td className="py-2 px-4">{event.user.username || 'N/A'}</td>
                                                        <td className="py-2 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${!event.banned
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {!event.banned ? 'Activo' : 'Bloqueado'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <Link to={`/event/${event.id}`} className="text-blue-500 hover:underline mr-2">Ver</Link>
                                                            <button
                                                                onClick={() => toggleEventActive(event.id, event.banned)}
                                                                className={`${!event.banned
                                                                    ? 'text-red-500 hover:text-red-700'
                                                                    : 'text-green-500 hover:text-green-700'
                                                                    } hover:underline`}
                                                            >
                                                                {!event.banned ? 'Bloquear' : 'Activar'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Componente de paginación */}
                                    <Pagination
                                        currentPage={eventsPagination.currentPage}
                                        totalPages={eventsPagination.totalPages}
                                        onPageChange={handleEventPageChange}
                                    />

                                    {/* Información sobre resultados */}
                                    <div className="text-sm text-gray-500 text-center mt-2">
                                        Mostrando {eventsList.length} de {eventsPagination.totalItems} eventos
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Cargando eventos...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activePanel === 'reports' && (
                        <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-fadeIn">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Reportes</h3>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>

                            {reportsList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white">
                                        <thead>
                                            <tr className="bg-gray-100 border-b">
                                                <th className="py-2 px-4 text-left">ID</th>
                                                <th className="py-2 px-4 text-left">Tipo</th>
                                                <th className="py-2 px-4 text-left">Estado</th>
                                                <th className="py-2 px-4 text-left">Fecha</th>
                                                <th className="py-2 px-4 text-left">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportsList.map(report => (
                                                <tr key={report.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-2 px-4">{report.id}</td>
                                                    <td className="py-2 px-4">{report.type}</td>
                                                    <td className="py-2 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium
                                                            ${report.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                                                report.status === 'Revisado' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-green-100 text-green-800'}`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4">{report.date}</td>
                                                    <td className="py-2 px-4">
                                                        <button className="text-blue-500 hover:underline mr-2">Ver</button>
                                                        <button className="text-green-500 hover:underline">Resolver</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Cargando reportes...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activePanel === 'settings' && (
                        <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-fadeIn">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Configuración</h3>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Configuración General</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre del sitio
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                defaultValue="Eventos App"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Correo de contacto
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                defaultValue="admin@eventos.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Opciones de Eventos</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="moderateEvents"
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                defaultChecked
                                            />
                                            <label htmlFor="moderateEvents" className="ml-2 text-sm text-gray-700">
                                                Moderar nuevos eventos
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="allowComments"
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                defaultChecked
                                            />
                                            <label htmlFor="allowComments" className="ml-2 text-sm text-gray-700">
                                                Permitir comentarios en eventos
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md">
                                    Guardar cambios
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        );
    }

    // Si ninguna condición se cumple, mostrar un indicador de carga por defecto
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-3">Cargando...</p>
        </div>
    );
}

export default Dashboard;