import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { useEvent } from '../context/EventContext'
import { eventCardClasses } from '../utils/Imagehelper'
const API_URL = import.meta.env.VITE_API_URL

function EventUser() {
  const { getImageUrl } = useEvent()
    const { token } = useAuth()
    const [events, setEvents] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    
    useEffect(() => {
        const fetchEvents = async () => {
            setError('')
            setLoading(true)
            try {
                // Cambia esta URL para que coincida con tu endpoint de eventos de usuario
                const response = await fetch(`${API_URL}/api/user/event/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                if (!response.ok) throw new Error("Error al obtener los eventos")

                const data = await response.json()
                
                setEvents(data)

            } catch (error) {
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [token]) // Añade token como dependencia

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    if (error || !events) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center my-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Ups! Algo salió mal</h2>
                <p className="text-gray-600 mb-6">{error || "No se encontró el evento solicitado"}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-6 py-2 
                      rounded-full hover:from-fuchsia-500 hover:to-indigo-500 transition-colors">
                    Intentar de nuevo
                </button>
            </div>
        )
    }
    return (
        <div>
            {events && events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            to={`/event/${event.id}`}
                            className="block group"
                        >
                            <div
                                className={`${eventCardClasses(event).replace('h-64', 'h-56')} 
                                            cursor-pointer transform transition-transform duration-300 hover:scale-[1.02]`}
                                style={event.image ? { backgroundImage: `url(${getImageUrl(event.image)})` } : {}}
                            >
                                {/* Capa de gradiente para mejorar legibilidad */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                                {/* Contenido de la tarjeta */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                                    <h2 className="text-lg font-bold drop-shadow-md">
                                        {event.title}
                                    </h2>
                                    <p className="text-gray-200 text-sm mt-1 drop-shadow-sm">
                                        {formatDate(event.event_date)}
                                    </p>
                                </div>

                                {/* Efecto hover para la tarjeta */}
                                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-6">No has creado eventos aún.</p>
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
    )
}

export default EventUser