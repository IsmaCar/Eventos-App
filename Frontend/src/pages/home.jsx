/**
 * Página principal de la aplicación
 *
 * Muestra:
 * - Landing page para usuarios no autenticados
 * - Dashboard de eventos para usuarios autenticados con opciones de filtrado
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvent } from '../context/EventContext';
import { getRandomGradient } from '../utils/Imagehelper'
import { isDatePassed } from '../utils/DateHelper';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

function home() {
    const { token } = useAuth();
    const { events, fetchEvents, getImageUrl } = useEvent();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos'); 
    const [filteredEvents, setFilteredEvents] = useState([]);


    useEffect(() => {
        let isMounted = true;

        const loadEvents = async () => {
            try {
                if (token) {
                    setLoading(true);
                    await fetchEvents();
                }
            } catch (error) {
                console.error("Error al cargar eventos:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (token) {
            loadEvents();
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [token]);

    // Efecto separado para filtrar los eventos
    useEffect(() => {
        if (!events || loading) {
            return;
        }

        const now = new Date();

        try {
            // Filtrar eventos según el criterio seleccionado
            let filtered = [];

            if (filter === 'todos') {
                // Para "todos", incluimos todos los eventos con fecha válida
                filtered = events.filter(event => {
                    if (!event.event_date) return false;

                    const eventDate = new Date(event.event_date);
                    return !isNaN(eventDate.getTime());
                });
            } else {
                // Para "próximos" o "pasados", aplicamos el filtro de fecha
                filtered = events.filter(event => {
                    if (!event.event_date) return false;

                    const eventDate = new Date(event.event_date);

                    if (isNaN(eventDate.getTime())) {
                        console.warn("Fecha inválida para evento:", event);
                        return false;
                    }                    
                    // Comparar solo la fecha (día, mes, año) sin la hora
                    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    
                    if (filter === 'proximos') {
                        return eventDay >= today;
                    } else {
                        return eventDay < today;
                    }
                });
            }

            // Ordenar los eventos
            const sorted = [...filtered].sort((a, b) => {
                const dateA = new Date(a.event_date);
                const dateB = new Date(b.event_date);

                if (filter === 'pasados') {
                    return dateB - dateA; // Más recientes primero para eventos pasados
                } else {
                    return dateA - dateB; // Más cercanos primero para eventos próximos y todos
                }
            });

            setFilteredEvents(sorted);
        } catch (error) {
            console.error("Error al filtrar eventos:", error);
            setFilteredEvents([]);
        }
    }, [events, filter, loading]);

    // Manejador para el cambio de filtro
    const handleFilterChange = (e) => {
        setFilter(e.target.value);
    };

    // Función para formatear la fecha de manera legible - Sin hora
    const formatEventDate = (dateString) => {
        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                return "Fecha no disponible";
            }

            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };

            return date.toLocaleDateString('es-ES', options);
        } catch (error) {
            console.error("Error formateando fecha:", error);
            return "Fecha no disponible";
        }
    };

    // Función para obtener el título según el filtro seleccionado
    const getFilterTitle = () => {
        switch (filter) {
            case 'proximos':
                return 'Próximos Eventos';
            case 'pasados':
                return 'Eventos Pasados';
            default:
                return 'Todos los Eventos';
        }
    };

    // Mostrar estado de carga
    if (loading) {
        return <Spinner containerClassName="h-96" color="indigo" text="Cargando eventos..." />;
    }

    const hasEvents = filteredEvents && filteredEvents.length > 0;    return (
        token ? (
            <main className="max-w-6xl mx-auto px-4 py-6">
                <section className="mb-8">
                    <article className="bg-white rounded-lg shadow-md p-6">
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            {/* Selector de filtro con la opción "Todos" */}
                            <nav className="relative w-full sm:w-64">
                                <select
                                    value={filter}
                                    onChange={handleFilterChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 
                                            hover:border-gray-400 px-4 py-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                            focus:ring-indigo-300 focus:border-indigo-300 text-gray-700"
                                >
                                    <option value="todos">Todos los eventos</option>
                                    <option value="proximos">Próximos eventos</option>
                                    <option value="pasados">Eventos pasados</option>                                </select>
                                <aside className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </aside>
                            </nav>
                            {/* Botón Crear Evento - Solo visible si hay eventos */}
                            {hasEvents && (
                                <Link
                                    to="/create-event"
                                    className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-6 py-3 
                                            rounded-lg font-medium hover:shadow-lg transform hover:scale-105 
                                            transition duration-300 ease-in-out flex items-center gap-2 whitespace-nowrap"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crear Evento
                                </Link>                            )}
                        </header>
                        {/* Listado de eventos según el filtro */}
                        <section className="mt-6">
                            <div className="container mx-auto">
                                <h1 className="text-2xl font-bold mb-6">
                                    {getFilterTitle()}
                                </h1>
                                {/* Verificar si hay eventos filtrados */}
                                {hasEvents ? (
                                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {filteredEvents.map((event) => (
                                            <Link
                                                key={event.id}
                                                to={`/event/${event.id}`}
                                                className="block group"
                                            >
                                                <article
                                                    className={`relative rounded-xl overflow-hidden h-60 shadow-md cursor-pointer transform 
                                                    transition-transform duration-300 hover:scale-[1.02]`}
                                                >
                                                    {/* Fondo con imagen o gradiente aleatorio */}
                                                    {event.image ? (
                                                        <figure
                                                            className="absolute inset-0 w-full h-full bg-cover bg-center"
                                                            style={{ backgroundImage: `url(${getImageUrl(event.image)})` }}
                                                        ></figure>
                                                    ) : (
                                                        <figure className={`absolute inset-0 w-full h-full ${getRandomGradient()}`}>
                                                            <div className="flex items-center justify-center h-full">
                                                                <span className="text-white text-4xl opacity-80"></span>
                                                            </div>
                                                        </figure>
                                                    )}                                                    {/* Capa de gradiente para mejorar legibilidad */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                                    
                                                    {/* Badge para eventos pasados */}
                                                    {isDatePassed(event.event_date) && (
                                                        <aside className="absolute top-4 right-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                                                            Finalizado
                                                        </aside>
                                                    )}

                                                    {/* Contenido de la tarjeta */}
                                                    <footer className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                                                        <h2 className="text-xl font-bold drop-shadow-md">
                                                            {event.title}
                                                        </h2>
                                                        <time className="text-gray-200 mt-1 drop-shadow-sm">
                                                            {formatEventDate(event.event_date)}
                                                        </time>
                                                    </footer>

                                                    {/* Efecto hover para la tarjeta */}
                                                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </article>
                                            </Link>
                                        ))}
                                    </section>                                
                                    ) : (
                                    <section className="text-center py-12">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-gray-500 text-lg mb-6">
                                            {filter === 'todos'
                                                ? 'No hay eventos disponibles.'
                                                : filter === 'proximos'
                                                    ? 'No hay eventos próximos disponibles.'
                                                    : 'No hay eventos pasados para mostrar.'}
                                        </p>                                        
                                        <Link
                                            to="/create-event"
                                            className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-6 py-3 
                                                rounded-lg font-medium hover:shadow-lg transform hover:scale-105 
                                                transition duration-300 ease-in-out inline-flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Crear tu primer evento
                                        </Link>
                                    </section>
                                )}
                            </div>
                        </section>
                    </article>
                </section>
            </main>        ) : (
            <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-fuchsia-50 py-12 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <section className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
                        <header className="p-8 md:p-12 flex flex-col items-center text-center">
                            <figure className="mb-6">
                                <img src="/images/logo.png" alt="Logo Eventos" className="h-24"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </figure>

                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-indigo-600 mb-4">
                                MEMENTO
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                                Da vida a invitaciones tan únicas como los momentos que celebras.
                            </p>

                            <nav className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <Link
                                    to="/login"
                                    className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-6 py-3 
                                               rounded-full hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out
                                               flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 
                                               rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition duration-300 ease-in-out
                                               flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Crear cuenta
                                </Link>
                            </nav>
                        </header>
                    </section>
                    {/* Features Section */}
                    <section className="text-center mb-12">
                        <header className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-800">Organiza eventos inolvidables</h2>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <figure className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </figure>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Crea eventos</h3>
                                <p className="text-gray-600">
                                    Diseña y personaliza tus eventos con fechas, ubicaciones y descripciones detalladas.
                                </p>
                            </article>

                            {/* Feature 2 */}
                            <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <figure className="w-16 h-16 rounded-full bg-fuchsia-100 flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </figure>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Invita asistentes</h3>
                                <p className="text-gray-600">
                                    Envía invitaciones y gestiona la lista de asistentes fácilmente.
                                </p>
                            </article>

                            {/* Feature 3 */}
                            <article className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <figure className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </figure>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Comparte memorias</h3>
                                <p className="text-gray-600">
                                    Sube y comparte fotos de tus eventos con todos los asistentes.
                                </p>
                            </article>
                        </div>
                    </section>
                    {/* CTA Section */}
                    <section className="text-center bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-2xl shadow-xl p-8 text-white">
                        <h2 className="text-3xl font-bold mb-4">¿Listo para crear tu primer evento?</h2>
                        <p className="text-xl mb-6 max-w-2xl mx-auto">
                            Únete a nuestra comunidad y comienza a organizar eventos inolvidables con herramientas diseñadas para hacerlo todo más fácil.
                        </p>
                    </section>
                </div>
            </main>
        )
    )
}

export default home