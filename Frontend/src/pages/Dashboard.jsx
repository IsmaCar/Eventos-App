import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';

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
        activeUsers: 0,
        bannedUsers: 0,
        activeEvents: 0,
        bannedEvents: 0
    });
    // Estados para controlar qué panel está activo
    const [activePanel, setActivePanel] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [eventsList, setEventsList] = useState([]);
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
        const checkAdmin = () => {
            try {
                if (user && user.roles) {
                    const hasAdminRole = user.roles.includes('ROLE_ADMIN');
                    setIsAdmin(hasAdminRole);
                } else {
                    setIsAdmin(false);
                }

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
            fetchStats();
            // Pre-cargar datos de usuarios y eventos para un acceso más rápido
            fetchUsers(1);
            fetchEvents(1);
        }
    }, [isAdmin, token]);

    // Función para cargar estadísticas
    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error en respuesta:", errorText);
                throw new Error('Error al cargar estadísticas');
            }

            const data = await response.json();

            setStats({
                users: data.users?.total || 0,
                events: data.events?.total || 0,
                photos: data.photos?.total || 0,
                activeUsers: data.users?.active || 0,
                bannedUsers: data.users?.banned || 0,
                activeEvents: data.events?.active || 0,
                bannedEvents: data.events?.banned || 0
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
            if (panel === 'users') {
                fetchUsers(usersPagination.currentPage);
            } else if (panel === 'events') {
                fetchEvents(eventsPagination.currentPage);
            }
        }
    };

    // Función para cargar usuarios
    const fetchUsers = async (page = 1) => {
        try {
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
            setUsersList(data.users || []);

            setUsersPagination({
                ...usersPagination,
                currentPage: page,
                totalItems: data.pagination?.totalItems.users,
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

            // Actualizar estadísticas después de cambiar el estado
            fetchStats();

        } catch (error) {
            console.error("Error al cambiar estado del usuario:", error);
            setError(`Error al cambiar estado del usuario: ${error.message}`);
        }
    };

    const toggleEventActive = async (eventId, currentlyBanned) => {
        try {
            const newBannedStatus = !currentlyBanned;

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

            // Actualizar la lista de eventos con el nuevo estado
            setEventsList(eventsList.map(event =>
                event.id === eventId
                    ? { ...event, banned: newBannedStatus }
                    : event
            ));

            // Actualizar estadísticas después de cambiar el estado
            fetchStats();

        } catch (error) {
            console.error("Error al cambiar estado del evento:", error);
            setError(`Error al cambiar estado del evento: ${error.message}`);
        }
    };

    // Si está cargando, mostrar spinner
    if (loading) {
        return <Spinner color="indigo" text="Verificando permisos..." containerClassName="h-screen" />;
    }

    // Si no es admin después de verificar, redirigir
    if (checked && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    // Solo renderiza el dashboard si hemos verificado y ES admin
    if (checked && isAdmin === true) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-6">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600">
                                Panel de Administración
                            </h1>
                            {/* Botón Volver al inicio eliminado */}
                        </div>
                        <p className="text-gray-600 max-w-3xl">
                            Bienvenido al panel de administración. Aquí puedes gestionar los usuarios y eventos de la plataforma.
                        </p>
                    </header>

                    {/* Mensaje de error si existe */}
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-r-md shadow-sm">
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Resumen estadístico modificado - sin indicadores activos/bloqueados */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                            <div className="flex justify-between">
                                <div>
                                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Usuarios Totales</h2>
                                    <p className="text-3xl font-bold text-gray-800 my-2">{stats.users}</p>
                                    {/* Eliminados los indicadores de usuarios activos/bloqueados */}
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                            <div className="flex justify-between">
                                <div>
                                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Eventos Totales</h2>
                                    <p className="text-3xl font-bold text-gray-800 my-2">{stats.events}</p>
                                    {/* Eliminados los indicadores de eventos activos/bloqueados */}
                                </div>
                                <div className="p-3 bg-fuchsia-50 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                            <div className="flex justify-between">
                                <div>
                                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fotografías</h2>
                                    <p className="text-3xl font-bold text-gray-800 my-2">{stats.photos}</p>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Contenido compartido en eventos
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            {/* Botón eliminado de la tarjeta de fotografías */}
                        </div>
                    </div>

                    {/* Panel de acciones rápidas */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
                        <div className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-4">
                            <h2 className="text-white text-lg font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947z" clipRule="evenodd" />
                                    <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
                                </svg>
                                Acciones Rápidas
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                            <button
                                onClick={() => togglePanel('users')}
                                className={`flex items-center p-4 rounded-lg transition-all ${activePanel === 'users'
                                        ? 'bg-indigo-500 text-white shadow-md'
                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                    }`}
                            >
                                <div className={`p-3 rounded-full ${activePanel === 'users' ? 'bg-indigo-600' : 'bg-white'} mr-4`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${activePanel === 'users' ? 'text-white' : 'text-indigo-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Gestionar Usuarios</h3>
                                    <p className={`text-sm ${activePanel === 'users' ? 'text-indigo-100' : 'text-gray-500'}`}>
                                        Administrar cuentas de usuario, estados y permisos
                                    </p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <button
                                onClick={() => togglePanel('events')}
                                className={`flex items-center p-4 rounded-lg transition-all ${activePanel === 'events'
                                        ? 'bg-fuchsia-500 text-white shadow-md'
                                        : 'bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100'
                                    }`}
                            >
                                <div className={`p-3 rounded-full ${activePanel === 'events' ? 'bg-fuchsia-600' : 'bg-white'} mr-4`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${activePanel === 'events' ? 'text-white' : 'text-fuchsia-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">Gestionar Eventos</h3>
                                    <p className={`text-sm ${activePanel === 'events' ? 'text-fuchsia-100' : 'text-gray-500'}`}>
                                        Moderar eventos, revisar contenido y gestionar permisos
                                    </p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Paneles dinámicos según la selección */}
                    {activePanel === 'users' && (
                        <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6 transition-all duration-300 animate-fadeIn">
                            <div className="bg-indigo-500 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    Gestión de Usuarios
                                </h3>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="text-white hover:text-indigo-100 transition-colors"
                                    aria-label="Cerrar panel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {usersList.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">ID</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Usuario</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Email</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Rol</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {usersList.map(user => (
                                                        <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="py-3 px-4 text-gray-600">{user.id}</td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-semibold mr-3">
                                                                        {user.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium text-gray-700">{user.username}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-500">{user.email}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.roles.includes('ROLE_ADMIN')
                                                                        ? 'bg-indigo-100 text-indigo-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'Usuario'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.banned !== false
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {user.banned ? 'Bloqueado' : 'Activo'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex space-x-2">
                                                                    <Link
                                                                        to={`/profile/${user.id}`}
                                                                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors text-sm font-medium"
                                                                    >
                                                                        Ver
                                                                    </Link>
                                                                    {user.roles.includes('ROLE_ADMIN') ? (
                                                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-sm font-medium cursor-not-allowed">
                                                                            Protegido
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => toggleUserActive(user.id, user.banned !== false, user.roles)}
                                                                            className={`px-3 py-1 rounded text-sm font-medium ${user.banned !== false
                                                                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                                } transition-colors`}
                                                                        >
                                                                            {user.banned ? 'Activar' : 'Bloquear'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6">
                                            <Pagination
                                                currentPage={usersPagination.currentPage}
                                                totalPages={usersPagination.totalPages}
                                                onPageChange={handleUserPageChange}
                                            />
                                            <div className="text-sm text-gray-500 text-center mt-2">
                                                Mostrando {usersList.length} de {usersPagination.totalItems} usuarios
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-10 flex flex-col items-center justify-center">
                                        <Spinner size="md" color="indigo" text="Cargando usuarios..." />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activePanel === 'events' && (
                        <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6 transition-all duration-300 animate-fadeIn">
                            <div className="bg-fuchsia-500 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Gestión de Eventos
                                </h3>
                                <button
                                    onClick={() => setActivePanel(null)}
                                    className="text-white hover:text-fuchsia-100 transition-colors"
                                    aria-label="Cerrar panel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                {eventsList.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b">
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">ID</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Título</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Creador</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                                                        <th className="py-3 px-4 text-left font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {eventsList.map(event => (
                                                        <tr key={event.id} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="py-3 px-4 text-gray-600">{event.id}</td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center">
                                                                    <div className="w-8 h-8 rounded bg-fuchsia-100 flex items-center justify-center text-fuchsia-500 mr-3">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="font-medium text-gray-700">{event.title}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-gray-500">{event.event_date}</td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center">
                                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs mr-2">
                                                                        {event.user.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span>{event.user.username}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${!event.banned
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {!event.banned ? 'Activo' : 'Bloqueado'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex space-x-2">
                                                                    <Link
                                                                        to={`/event/${event.id}`}
                                                                        className="px-3 py-1 bg-fuchsia-50 text-fuchsia-600 rounded hover:bg-fuchsia-100 transition-colors text-sm font-medium"
                                                                    >
                                                                        Ver
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => toggleEventActive(event.id, event.banned)}
                                                                        className={`px-3 py-1 rounded text-sm font-medium ${!event.banned
                                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                                            } transition-colors`}
                                                                    >
                                                                        {!event.banned ? 'Bloquear' : 'Activar'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6">
                                            <Pagination
                                                currentPage={eventsPagination.currentPage}
                                                totalPages={eventsPagination.totalPages}
                                                onPageChange={handleEventPageChange}
                                            />
                                            <div className="text-sm text-gray-500 text-center mt-2">
                                                Mostrando {eventsList.length} de {eventsPagination.totalItems} eventos
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-10 flex flex-col items-center justify-center">
                                        <Spinner size="md" color="fuchsia" text="Cargando eventos..." />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Si ninguna condición se cumple, mostrar un indicador de carga por defecto
    return <Spinner containerClassName="h-screen" text="Cargando..." />;
}

export default Dashboard;