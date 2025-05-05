import React, { useEffect, useState } from 'react'
import { useEvent } from '../context/EventContext'
import { Link, useParams } from 'react-router-dom'
import { LocationPicker } from '../components/Maps'

function CardDetail() {
  const { getEventById, getImageUrl } = useEvent()
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true)
        const data = await getEventById(id)
        console.log("Datos del evento:", data)
        setEvent(data.event || data) 
        setLoading(false)
      } catch (err) {
        console.error("Error cargando el evento:", err)
        setError("No se pudo cargar el evento")
        setLoading(false)
      }
    }
    loadEventData()
  }, [id, getEventById])

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible"

    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('es-ES', options)
    } catch (error) {
      return dateString
    }
  }
  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Mostrar error si existe
  if (error || !event) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Ups! Algo salió mal</h2>
        <p className="text-gray-600 mb-6">{error || "No se encontró el evento solicitado"}</p>
        <Link to="/" className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white px-6 py-2 
                  rounded-full hover:from-fuchsia-500 hover:to-indigo-500 transition-colors">
          Volver al inicio
        </Link>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-6xl mx-auto">
      {/* Imagen de cabecera */}
      <div
        className="h-64 md:h-80 bg-cover bg-center"
        style={event.image ? { backgroundImage: `url(${getImageUrl(event.image)})` } : {
          background: `linear-gradient(135deg, rgba(236,72,153,0.9) 0%, rgba(139,92,246,0.9) 100%)`
        }}
      >
        <div className="h-full w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
          <div className="p-6 text-white">
            <h1 className="text-3xl font-bold drop-shadow-lg">{event.title}</h1>
            {event.subtitle && (
              <p className="text-xl text-gray-200 mt-2 drop-shadow-md">{event.subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="p-6">
        {/* Detalles principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Fecha */}
          <div className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-4 rounded-lg border border-fuchsia-100 shadow-sm">
            <h3 className="font-semibold text-fuchsia-600 mb-2">Fecha</h3>
            <p className="text-gray-700">{formatDate(event.event_date)}</p>
            {event.time && <p className="text-gray-700 mt-1">{event.time}</p>}
          </div>

          {/* Ubicación */}
          <div className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-4 rounded-lg border border-fuchsia-100 shadow-sm md:col-span-2">
            <h3 className="font-semibold text-fuchsia-600 mb-2">Ubicación</h3>

            {typeof event.location === 'object' ? (
              <div>
                {event.location.latitude && event.location.longitude ? (
                  <LocationPicker
                    readOnly={true}
                    initialLocation={{
                      lat: parseFloat(event.location.latitude),
                      lng: parseFloat(event.location.longitude),
                      address: event.location.address
                    }}
                  />
                ) : (
                  <p className="text-gray-500 italic">Ubicación no disponible</p>
                )}
              </div>
            ) : (
              <p className="text-gray-700">
                {typeof event.location === 'string' ? event.location : "No especificada"}
              </p>
            )}
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Acerca de este evento</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-4 justify-between mt-8">
          <Link
            to="/"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            Volver a Eventos
          </Link>

          <button
            className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white px-6 py-2 
                    rounded-full hover:from-fuchsia-600 hover:to-indigo-600 transition-colors shadow-md"
          >
            Confirmar asistencia
          </button>
        </div>
      </div>
      )
}

      export default CardDetail