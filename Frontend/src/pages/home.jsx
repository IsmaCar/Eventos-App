import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvent } from '../context/EventContext';
import { eventCardClasses } from '../helper/Imagehelper'
import { useAuth } from '../context/AuthContext';

function home() {
    const { token } = useAuth();
    const { events, fetchEvents, getImageUrl } = useEvent();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos');
    const [filteredEvents, setFilteredEvents] = useState([]);

    // Separamos la carga inicial de eventos
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
                    
                    if (filter === 'proximos') {
                        return eventDate >= now;
                    } else {
                        return eventDate < now;
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
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    const hasEvents = filteredEvents && filteredEvents.length > 0;

    return (
        token ? (
            <div className="max-w-6xl mx-auto px-4 py-6">
                <section className="mb-8">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <div className="flex justify-between items-center mb-6">
                            {/* Selector de filtro con la opción "Todos" */}
                            <div className="relative w-64">
                                <select
                                    value={filter}
                                    onChange={handleFilterChange}
                                    className="block appearance-none w-full bg-white border border-gray-300 
                                            hover:border-gray-400 px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                            focus:ring-indigo-300 focus:border-indigo-300"
                                >
                                    <option value="todos">Todos los eventos</option>
                                    <option value="proximos">Próximos eventos</option>
                                    <option value="pasados">Eventos pasados</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Botón Crear Evento - Solo visible si hay eventos */}
                            {hasEvents && (
                                <Link
                                    to="/create-event"
                                    className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-4 py-2 
                                            rounded-full hover:scale-105 transition duration-300 ease-in-out"
                                >
                                    Crear Evento
                                </Link>
                            )}
                        </div>

                        {/* Listado de eventos según el filtro */}
                        <div className="mt-6">
                            <div className="container mx-auto">
                                <h1 className="text-2xl font-bold mb-6">
                                    {getFilterTitle()}
                                </h1>

                                {/* Verificar si hay eventos filtrados */}
                                {hasEvents ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {filteredEvents.map((event) => (
                                            <Link
                                                key={event.id}
                                                to={`/event/${event.id}`}
                                                className="block group"
                                            >
                                                <div
                                                    className={`${eventCardClasses(event).replace('h-64', 'h-60')} 
                                                                cursor-pointer transform transition-transform duration-300 hover:scale-[1.02]`}
                                                    style={event.image ? { backgroundImage: `url(${getImageUrl(event.image)})` } : {}}
                                                >
                                                    {/* Capa de gradiente para mejorar legibilidad */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                                                    {/* Badge para eventos pasados - ahora usando la fecha real */}
                                                    {new Date(event.event_date) < new Date() && (
                                                        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                                                            Finalizado
                                                        </div>
                                                    )}

                                                    {/* Contenido de la tarjeta */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                                                        <h2 className="text-xl font-bold drop-shadow-md">
                                                            {event.title}
                                                        </h2>
                                                        <p className="text-gray-200 mt-1 drop-shadow-sm">
                                                            {formatEventDate(event.event_date)}
                                                        </p>
                                                    </div>

                                                    {/* Efecto hover para la tarjeta */}
                                                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
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
                                            className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-6 py-2.5 
                                                rounded-full hover:scale-105 transition duration-300 ease-in-out inline-flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Crear tu primer evento
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        ) : (
            <div className='bg-gray-100 max-w-3xl mx-auto rounded-lg shadow-xl my-8 p-6 border-none'>
                <div className="flex justify-center mt-6">
                    <img src="../public/images/logo.png" alt="logo web" className="max-w-40" />
                </div>
                <h1 className="text-5xl font-bold text-center mt-2">
                    EVENTOS
                </h1>
                <p className="text-xl text-center mt-4">Da vida a invitaciones tan únicas como los momentos que celebras.</p>

                <section className="mt-8 flex justify-center">
                    <Link to="/login" className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-9 py-2 
                                             rounded-full hover:scale-107 transition duration-300 ease-in-out">
                        Iniciar Sesión
                    </Link>
                </section>
            </div>
        )
    )
}

export default home