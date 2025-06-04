/**
 * Barra de navegación principal de la aplicación
 * Contiene enlaces principales, notificaciones y acceso a perfil
 */
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Avatar } from '../utils/Imagehelper';

function Navbar() {
    const { token, user, isAdmin, logout } = useAuth();
    const { hasNotifications } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showNoNotificationsTooltip, setShowNoNotificationsTooltip] = useState(false);

    // Detecta scroll para aplicar efectos visuales en la barra
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    // Cierra el menú móvil automáticamente al cambiar de ruta
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Cierra el tooltip después de 2 segundos
    useEffect(() => {
        if (showNoNotificationsTooltip) {
            const timer = setTimeout(() => {
                setShowNoNotificationsTooltip(false);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [showNoNotificationsTooltip]);

    // Función para manejar el clic en el botón de notificaciones
    const handleNotificationsClick = (e) => {
        // Si no hay notificaciones, mostrar tooltip en lugar de navegar
        if (!hasNotifications) {
            e.preventDefault();
            setShowNoNotificationsTooltip(true);
            return;
        }

        // Establecer bandera simple para activar la lógia en Profile.jsx
        localStorage.setItem('openNotificationsModal', 'true');

        // Navegar a la página de perfil con parámetro para la pestaña de solicitudes
        navigate('/profile?tab=requests');
    };

    // Clases CSS dinámicas según el estado de autenticación y scroll
    const navbarClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${token
        ? `bg-zinc-800 ${scrolled ? 'shadow-md' : ''}`
        : scrolled
            ? 'bg-zinc-900/95 backdrop-blur-sm shadow-md'
            : 'bg-zinc-900/90'
        }`;

    const textClass = 'text-white';
    const hoverClass = 'hover:bg-zinc-700';

    return (
        <div>
            <nav className={navbarClasses}>
                <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <section className="flex justify-between items-center h-16">
                        {/* Logo y nombre de la aplicación */}
                        <aside className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <img
                                    src={"/images/logo.png" || null}
                                    alt="Memento"
                                    className="h-10 w-auto"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                    }}
                                />
                                <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-indigo-600">
                                    MEMENTO
                                </span>
                            </Link>
                            {/* Acceso al panel de administración (solo admins) */}
                            {token && isAdmin && (
                                <Link
                                    to="/dashboard"
                                    className="ml-4 hidden md:flex bg-indigo-600 text-white px-3 py-1.5 
                                               rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:mr-0 lg:mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span className="hidden lg:inline">Administrar</span>                                
                                </Link>
                            )}
                        </aside>

                        {/* Menú principal para escritorio (solo usuarios autenticados) */}
                        {token && (
                            <section className="hidden md:flex md:items-center">
                                <nav className="flex items-center space-x-4">
                                    {/* Fotos favoritas */}
                                    <Link
                                        to="/favorite-photos"
                                        className="flex items-center text-white px-3 py-1.5 
                                                   rounded-lg hover:bg-zinc-700 transition duration-300 ease-in-out"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:mr-1 lg:mr-1 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <span className="hidden lg:inline">Fotos favoritas</span>
                                    </Link>

                                    {/* Centro de notificaciones */}
                                    <button
                                        onClick={handleNotificationsClick}
                                        className={`flex items-center text-white px-3 py-1.5 
                                         rounded-lg transition duration-300 ease-in-out relative
                                         ${hasNotifications ? hoverClass : 'opacity-70 cursor-not-allowed'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <span>Notificaciones</span>

                                        {/* Indicador de notificaciones sin leer */}
                                        {hasNotifications && (
                                            <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                                        )}
                                        {/* Tooltip para indicar que no hay notificaciones */}
                                        {showNoNotificationsTooltip && (
                                            <aside className="absolute top-12 right-0 bg-zinc-700 text-white text-sm rounded-lg px-4 py-2 shadow-lg z-50 w-48">
                                                No tienes notificaciones nuevas
                                                <figure className="absolute -top-2 right-4 w-0 h-0 
                                                border-l-8 border-r-8 border-b-8 
                                                border-l-transparent border-r-transparent border-b-zinc-700"></figure>
                                            </aside>
                                        )}
                                    </button>

                                    {/* Acceso al perfil con avatar */}
                                    <Link
                                        to="/profile"
                                        className="flex items-center text-white px-3 py-1.5 
                                                   rounded-lg hover:bg-zinc-700 transition duration-300 ease-in-out"
                                    >
                                        <Avatar
                                            user={user}
                                            size="xs"
                                            className="mr-2 border-2 border-white/30"
                                        />
                                        <span>Perfil</span>
                                    </Link>
                                    {/* Botón de cierre de sesión */}
                                    <button
                                        onClick={logout}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 
                                                  rounded-lg transition duration-300 ease-in-out flex items-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:mr-0 lg:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>                                        <span className="hidden lg:inline">Cerrar Sesión</span>
                                    </button>
                                </nav>
                            </section>
                        )}

                        {/* Botón de hamburguesa para menú móvil */}
                        {token && (
                            <aside className="md:hidden flex items-center relative">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className={`${textClass} p-2 rounded-lg ${hoverClass} transition duration-300`}
                                    aria-label="Toggle menu"
                                >
                                    {mobileMenuOpen ? (
                                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    )}
                                </button>

                                {/* Indicador de notificaciones para móvil */}                                
                                {hasNotifications && (
                                    <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></span>
                                )}
                            </aside>
                        )}
                    </section>
                </header>

                {/* Menú desplegable para dispositivos móviles */}
                {token && mobileMenuOpen && (
                    <section className="md:hidden bg-zinc-800 shadow-lg">
                        <nav className="px-4 py-3 space-y-2"><Link
                            to="/favorite-photos"
                            className="flex items-center text-white px-3 py-2 rounded-lg hover:bg-zinc-700 transition duration-300 ease-in-out"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Fotos favoritas
                        </Link>
                            {/* Notificaciones en versión móvil */}
                            <button
                                onClick={handleNotificationsClick}
                                className={`flex items-center text-white px-3 py-2 w-full text-left
                                            rounded-lg transition duration-300 ease-in-out relative
                                 ${hasNotifications ? 'hover:bg-zinc-700' : 'opacity-70 cursor-not-allowed'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Notificaciones

                                {hasNotifications && (
                                    <span className="absolute top-1 right-1 transform w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></span>
                                )}
                                {/* Tooltip para móvil */}
                                {showNoNotificationsTooltip && (
                                    <aside className="absolute top-10 left-0 bg-zinc-700 text-white text-sm rounded-lg px-4 py-2 shadow-lg z-50 w-full">
                                        No tienes notificaciones nuevas
                                    </aside>
                                )}
                            </button>
                            {/* Perfil en versión móvil */}
                            <Link
                                to="/profile"
                                className="flex items-center text-white px-3 py-2 rounded-lg hover:bg-zinc-700 transition duration-300 ease-in-out"
                            >
                                <Avatar
                                    user={user}
                                    size="xs"
                                    className="mr-2 border-2 border-white/30"
                                />
                                Perfil
                            </Link>
                            {/* Acceso a administración (solo admins) */}
                            {isAdmin && (
                                <Link
                                    to="/dashboard"
                                    className="flex items-center text-white px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition duration-300 ease-in-out"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Administrar
                                </Link>
                            )}
                            {/* Cerrar sesión en versión móvil */}
                            <button
                                onClick={logout}
                                className="w-full flex items-center text-white px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition duration-300 ease-in-out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />                                
                                </svg>
                                Cerrar Sesión
                            </button>
                        </nav>
                    </section>
                )}
            </nav>
            {/* Espaciador para compensar la altura del navbar fijo */}
            <section className="h-16"></section>
        </div>
    );
}

export default Navbar;