import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvent } from '../context/EventContext';
import { eventCardClasses } from '../helper/Imagehelper'
import { useAuth } from '../context/AuthContext';

function home() {
    const { token } = useAuth()
    const { events, fetchEvents, getImageUrl } = useEvent()
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (token) {
            setLoading(true)
            fetchEvents();
        }
        setLoading(false)
    }, []);

    // Mostrar estado de carga
    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    return (
        token ? (
            <div className="max-w-6xl mx-auto px-4 py-6">
                <section className="mb-8">
                    

                    <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-end items-center mb-6">
                        <Link
                            to="/create-event"
                            className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-4 py-2 
                                       rounded-full hover:scale-105 transition duration-300 ease-in-out"
                        >
                            Crear Evento
                        </Link>
                    </div>
                        <div className="relative w-64">
                            <select
                                // value={filter}
                                //onChange={handleFilterChange}
                                className="block appearance-none w-full bg-white border border-gray-300 
                                        hover:border-gray-400 px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                        focus:ring-indigo-300 focus:border-indigo-300"
                            >
                                <option value="proximos">📅 Próximos eventos</option>
                                <option value="pasados">📅 Eventos pasados</option>
                                <option value="borradores">🗒️ Borradores</option>
                                <option value="organizados">👑 Organizados por mí</option>
                                <option value="confirmados">✅ Confirmados</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>

                        {/* Aquí irá el listado de eventos según el filtro */}
                        <div className="mt-6">
                            <div className="container mx-auto p-4">
                                <h1 className="text-3xl font-bold mb-6">Eventos Disponibles</h1>

                                {/* Verificar si events existe y tiene elementos */}
                                {events && events.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {events.map((event) => (
                                            <Link
                                                key={event.id}
                                                to={`/event/${event.id}`}
                                                className="block group"
                                            >
                                                <div
                                                    className={`${eventCardClasses(event).replace('h-64', 'h-100')} 
                                                                cursor-pointer transform transition-transform duration-300 hover:scale-[1.02]`}
                                                    style={event.image ? { backgroundImage: `url(${getImageUrl(event.image)})` } : {}}
                                                >
                                                    {/* Capa de gradiente para mejorar legibilidad */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                                                    {/* Contenido de la tarjeta */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                                                        <h2 className="text-xl font-bold drop-shadow-md">
                                                            {event.title}
                                                        </h2>
                                                        <p className="text-gray-200 mt-1 drop-shadow-sm">
                                                            {event.event_date}
                                                        </p>
                                                    </div>

                                                    {/* Efecto hover para la tarjeta */}
                                                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No hay eventos disponibles.</p>
                                        <Link
                                            to="/create-event"
                                            className="inline-block mt-4 bg-gradient-to-r from-fuchsia-400/80 to-indigo-400/80 backdrop-blur-sm 
                                               text-white px-4 py-2 rounded hover:from-fuchsia-400 hover:to-indigo-400 transition-colors"
                                        >
                                            Crear mi primer evento
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