/**
 * Componente que muestra los eventos creados por el usuario actual
 * Se utiliza en el perfil del usuario para listar todos sus eventos
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { useEvent } from '../context/EventContext'
import { getRandomGradient } from '../utils/Imagehelper';
import { formatLongDate, isDatePassed } from '../utils/DateHelper'
import Spinner from './Spinner'
import { useToast } from '../hooks/useToast'

const API_URL = import.meta.env.VITE_API_URL

function EventsUser() {
  const { getImageUrl } = useEvent()
  const { token } = useAuth()
  const { error } = useToast()
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/user/event/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error("Error al obtener los eventos")

        const data = await response.json()
        // Filtrar solo eventos activos y no banneados
        const filteredEvents = data.filter(event =>
          event.status === 'activated' &&
          event.banned !== true)
        setEvents(filteredEvents)
      } catch (err) {
        error(err.message)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [token])


  if (loading) {
    return <Spinner size="lg" color="indigo" containerClassName="py-20" text="Cargando tus eventos..." />;
  }
  if (!events) {
    return (
      <section className="bg-white rounded-lg shadow-md p-8 text-center my-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Ups! Algo salió mal</h2>
        <p className="text-gray-600 mb-6">No se encontró el evento solicitado</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-6 py-2 
                  rounded-full hover:from-fuchsia-500 hover:to-indigo-500 transition-colors">
          Intentar de nuevo
        </button>
      </section>
    )
  }
  return (
    <>
      {events && events.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/event/${event.id}`}
              className="block group"
            >
              <article
                className="relative rounded-xl overflow-hidden h-56 shadow-md cursor-pointer transform transition-transform duration-300">
                {/* Renderizado condicional para el fondo: usa imagen del evento si existe o gradiente aleatorio si no */}
                {event.image ? (
                  <figure
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${getImageUrl(`/uploads/backgrounds/${event.image}`)})` }}
                  ></figure>
                ) : (
                  <aside className={`absolute inset-0 w-full h-full ${getRandomGradient()}`}>
                    <header className="flex items-center justify-center h-full">
                      <span className="text-white text-4xl opacity-80"></span>
                    </header>
                  </aside>
                )}
                {/* Capa de gradiente superpuesta para mejorar contraste */}
                <aside className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></aside>

                {/* Indicador visual de eventos ya finalizados basado en la fecha */}
                {isDatePassed(event.event_date) && (
                  <aside className="absolute top-4 right-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                    Finalizado
                  </aside>
                )}

                {/* Información principal del evento posicionada en la parte inferior */}
                <footer className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                  <h2 className="text-lg font-bold drop-shadow-md">
                    {event.title}
                  </h2>
                  <time className="text-gray-200 text-sm mt-1 drop-shadow-sm">
                    {formatLongDate(event.event_date)}
                  </time>
                </footer>

                {/* Efecto visual de resaltado al pasar el cursor por encima */}
                <aside className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></aside>
              </article>
            </Link>
          ))}
        </section>
      ) : (
        <section className="text-center py-10">
          <p className="text-gray-500 mb-6">No has creado eventos aún.</p>
          <Link
            to="/create-event"
            className="inline-block mt-4 bg-gradient-to-r from-fuchsia-400/80 to-indigo-400/80 backdrop-blur-sm 
                     text-white px-4 py-2 rounded hover:from-fuchsia-400 hover:to-indigo-400 transition-colors"
          >
            Crear mi primer evento
          </Link>
        </section>
      )}
    </>
  )
}

export default EventsUser