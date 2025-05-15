import React, { useEffect, useState } from 'react'
import { useEvent } from '../context/EventContext'
import { useAuth } from '../context/AuthContext'  // Añadimos para verificar usuario
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LocationPicker } from '../components/Maps'
import InviteUsers from '../components/InviteUsers'
import EventInvitations from '../components/EventInvitations'


const API_URL = import.meta.env.VITE_API_URL;

function CardDetail() {
  const { getEventById, getImageUrl } = useEvent()
  const { user, token } = useAuth()
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('invite')

  // Estados específicos para fotos
  const [photos, setPhotos] = useState([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [expandedPhoto, setExpandedPhoto] = useState(null)
  const [photoFavorites, setPhotoFavorites] = useState({}) 

  // Estados para asistentes
  const [attendees, setAttendees] = useState([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  
  // Nueva función para cancelar asistencia
  const cancelAttendance = async (attendeeId) => {
    if (!token) return;
    
    try {
      if (!confirm('¿Estás seguro de que deseas cancelar tu asistencia a este evento?')) {
        return;
      }
      
      const response = await fetch(`${API_URL}/api/events/${id}/cancel-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo cancelar la asistencia');
      }
      
      // Actualizar la lista de asistentes quitando al usuario actual
      setAttendees(attendees.filter(attendee => parseInt(attendee.id) !== parseInt(user.id)));
      alert('Has cancelado tu asistencia al evento correctamente');
    } catch (error) {
      console.error("Error cancelando asistencia:", error);
      alert('Error: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchEventAttendees = async () => {
      if (!id || !token) return;

      try {
        setLoadingAttendees(true);
        const response = await fetch(`${API_URL}/api/events/${id}/attendees`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('No se pudieron cargar los asistentes');
        }

        const data = await response.json();
        setAttendees(data.attendees || []);

      } catch (error) {
        console.error('Error al cargar los asistentes:', error);
      } finally {
        setLoadingAttendees(false);
      }
    };

    if (event) {
      fetchEventAttendees();
    }
  }, [id, token, event, user]);


  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true)
        const data = await getEventById(id)
        console.log("Datos del evento:", data)
        setEvent(data.event || data)
        setLoading(false)

        // Cargamos las fotos después de tener los datos del evento
        fetchEventPhotos()
      } catch (err) {
        console.error("Error cargando el evento:", err)
        setError("No se pudo cargar el evento")
        setLoading(false)
      }
    }
    loadEventData()
  }, [id, getEventById])

  // Función para cargar las fotos del evento
  const fetchEventPhotos = async () => {
    try {
      setLoadingPhotos(true)
      const response = await fetch(`${API_URL}/api/events/${id}/photos`)

      if (!response.ok) {
        throw new Error('Error al cargar las fotos')
      }

      const data = await response.json()
      const photosArray = data.photos || []
      setPhotos(photosArray)

      // Si hay token y fotos, cargar el estado de favoritos
      if (token && photosArray.length > 0) {
        fetchFavoritesStatus(photosArray)
      }
    } catch (error) {
      console.error('Error al cargar las fotos:', error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  // Función para cargar el estado de favoritos
  const fetchFavoritesStatus = async (photosArray) => {
    if (!token) return;

    try {
      // Creamos un objeto para mapear favoritos por ID
      const favoritesMap = {};

      // Hacemos peticiones en paralelo para verificar cada foto
      await Promise.all(photosArray.map(async (photo) => {
        const response = await fetch(`${API_URL}/api/photos/${photo.id}/is-favorite`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          favoritesMap[photo.id] = data.isFavorite;
        }
      }));

      setPhotoFavorites(favoritesMap);
    } catch (error) {
      console.error('Error al cargar estado de favoritos:', error);
    }
  };

  // Función para marcar/desmarcar favorito
  const toggleFavorite = async (photoId, e) => {
    // Evitar que se abra la vista ampliada
    e.stopPropagation()

    if (!token) {
      // Redireccionar al login o mostrar mensaje
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/photos/${photoId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Actualizar estado local para reflejar cambio inmediatamente
        setPhotoFavorites(prev => ({
          ...prev,
          [photoId]: data.isFavorite
        }))
      }
    } catch (error) {
      console.error('Error al cambiar favorito:', error)
    }
  }

  // Navegación a página de favoritos
  const goToFavorites = () => {
    navigate('/favorite-photos')
  }

  // Función para manejar la selección de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
    } else {
      setSelectedFile(null)
    }
  }

  // Función para subir la foto
  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      return
    }

    if (!token) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('photo', selectedFile)

      const response = await fetch(`${API_URL}/api/events/${id}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al subir la foto')
      }

      // Éxito
      setSelectedFile(null)
      // Refrescar la lista de fotos
      fetchEventPhotos()
    } catch (error) {
      console.error('Error al subir foto:', error)
    } finally {
      setUploading(false)
    }
  }

  // Funciones para vista expandida
  const openExpandedView = (photo) => {
    setExpandedPhoto(photo);
    document.body.style.overflow = 'hidden';
  }

  const closeExpandedView = () => {
    setExpandedPhoto(null);
    document.body.style.overflow = 'auto';
  }

  // Función para manejar cuando se envía una invitación exitosamente
  const handleInvitationSent = () => {
    // Cambiar a la pestaña de gestión después de enviar una invitación
    setActiveTab('manage');
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible"

    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('es-ES', options)
    } catch (error) {
      return dateString
    }
  }

  // Función mejorada para verificar si el usuario actual es el creador del evento
  const isEventCreator = () => {
    if (!user || !event) return false;

    // Convertir ambos valores a números para comparación directa
    const currentUserId = parseInt(user.id, 10);
    const eventUserId = parseInt(event.user_id, 10);

    return !isNaN(eventUserId) && currentUserId === eventUserId;
  };

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
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-6xl mx-auto mb-8">
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

      {/* Contenido con padding */}
      <div className="p-6">
        {/* Detalles principales */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
          {/* Fecha - más pequeña */}
          <div className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-6 rounded-lg border border-fuchsia-100 shadow-sm md:col-span-3">
            <h3 className="font-semibold text-fuchsia-600 mb-2">Fecha</h3>
            <p className="text-gray-700">{formatDate(event.event_date)}</p>
            {event.time && <p className="text-gray-700 mt-1">{event.time}</p>}
            <div className="mt-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Acerca de este evento</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>

          {/* Ubicación - más pequeña */}
          <div className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-6 rounded-lg border border-fuchsia-100 shadow-sm md:col-span-5">
            <h3 className="font-semibold text-fuchsia-600 mb-3">Ubicación</h3>

            {event.location ? (
              typeof event.location === 'object' && event.location !== null ? (
                <>
                  <div className="h-60 relative w-full overflow-hidden rounded-md">
                    {event.location.latitude && event.location.longitude ? (
                      <LocationPicker
                        readOnly={true}
                        initialLocation={{
                          lat: parseFloat(event.location.latitude),
                          lng: parseFloat(event.location.longitude),
                          address: event.location.address || ''
                        }}
                        containerStyle={{ height: '100%', width: '100%' }}
                      />
                    ) : (
                      <p className="text-gray-500 italic">Coordenadas no disponibles</p>
                    )}
                  </div>

                  {/* Dirección debajo del mapa */}
                  {event.location.address && (
                    <div className="mt-3 p-2">
                      <p className="text-gray-700 text-sm flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-fuchsia-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location.address}</span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-700">
                  {typeof event.location === 'string' ? event.location : "No especificada"}
                </p>
              )
            ) : (
              <p className="text-gray-500 italic">Ubicación no especificada</p>
            )}
          </div>

          {/* Lista de asistentes - nueva sección */}
          <div className="bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-6 rounded-lg border border-indigo-100 shadow-sm md:col-span-4">
            <h3 className="font-semibold text-indigo-600 mb-3">Asistentes</h3>

            {loadingAttendees ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : attendees.length > 0 ? (
              <div className="max-h-80 overflow-y-auto pr-2">
                <ul className="divide-y divide-gray-200">
                  {attendees.map((attendee) => {
                    // Determinar si este asistente es el usuario actual
                    const isCurrentUser = user && parseInt(user.id) === parseInt(attendee.id);

                    // Ruta del enlace: profile/id para otros, /profile para el usuario actual
                    const profileLink = isCurrentUser ? '/profile' : `/profile/${attendee.id}`;

                    return (
                      <li key={attendee.id} className="py-2">
                        <div className="flex items-center justify-between">
                          <Link
                            to={profileLink}
                            className="py-2 flex items-center gap-3 hover:bg-indigo-50/50 rounded px-2 transition-colors flex-grow"
                          >
                            {/* Avatar del usuario con imagen de perfil si existe */}
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-100 bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex items-center justify-center">
                              <img
                                src={attendee.avatar ? `${API_URL}/uploads/avatars/${attendee.avatar}` : ''}
                                alt={`${attendee.username}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Nombre de usuario */}
                            <span className="text-gray-700 font-medium">
                              {attendee.username}
                              {isCurrentUser && <span className="ml-1 text-xs text-indigo-500">(Tú)</span>}
                            </span>

                            {/* Indicador de organizador */}
                            {attendee.isCreator && (
                              <span className="ml-auto text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                                Organizador
                              </span>
                            )}
                          </Link>
                          
                          {/* Botón para cancelar asistencia - solo para el usuario actual que no sea organizador */}
                          {isCurrentUser && !attendee.isCreator && (
                            <button
                              onClick={cancelAttendance}
                              className="ml-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-full transition-colors flex items-center"
                              title="Cancelar asistencia"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              no asistiré
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 italic">
                  No hay asistentes confirmados aún
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN DE INVITACIONES (solo para el creador del evento) */}
        {isEventCreator() && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestionar invitaciones</h2>

            {/* Pestañas para invitar y ver invitaciones */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px space-x-8">
                  <button
                    onClick={() => setActiveTab('invite')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'invite'
                      ? 'border-fuchsia-500 text-fuchsia-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Invitar usuarios
                  </button>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'manage'
                      ? 'border-fuchsia-500 text-fuchsia-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Gestionar invitaciones
                  </button>
                </nav>
              </div>

              {/* Contenido de las pestañas */}
              <div className="py-6">
                {activeTab === 'invite' ? (
                  <InviteUsers
                    eventId={id}
                    onInvitationSent={handleInvitationSent}
                  />
                ) : (
                  <EventInvitations eventId={id} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN: FOTOS DEL EVENTO (con favoritos) */}
        <div className="mt-12 border-t pt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Fotos del evento</h2>

            {/* Botón para ir a favoritos */}
            {token && (
              <button
                onClick={goToFavorites}
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Ver mis favoritas
              </button>
            )}
          </div>

          {/* Subir nueva foto */}
          {token && (
            <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-4">¿Estuviste en este evento? ¡Comparte tus fotos!</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100"
                  disabled={uploading}
                />
                <button
                  onClick={handleUploadPhoto}
                  disabled={!selectedFile || uploading}
                  className={`px-5 py-2 rounded-md text-white font-medium ${!selectedFile || uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600'
                    }`}
                >
                  {uploading ? 'Subiendo...' : 'Subir foto'}
                </button>
              </div>
            </div>
          )}

          {/* Mostrar fotos con botones de favorito */}
          <div className="mt-6">
            {loadingPhotos ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group overflow-hidden rounded-lg shadow-md aspect-square cursor-pointer"
                    onClick={() => openExpandedView(photo)}
                  >
                    <img
                      src={`${API_URL}/uploads/event_photos/${photo.filename}`}
                      alt={`Foto de ${event.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-white text-sm font-medium">{photo.user?.username || "Usuario"}</p>

                        {/* Botón de favorito */}
                        {token && (
                          <button
                            onClick={(e) => toggleFavorite(photo.id, e)}
                            className="text-white hover:text-pink-400 transition-colors"
                          >
                            {photoFavorites[photo.id] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-gray-200 text-xs">{new Date(photo.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aún no hay fotos para este evento. ¡Sé el primero en compartir una!</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para vista ampliada con botón de favorito */}
        {expandedPhoto && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeExpandedView}
          >
            <div className="relative max-w-5xl max-h-[90vh] w-full">
              {/* Botón de cierre */}
              <button
                className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center z-10"
                onClick={closeExpandedView}
              >
                &times;
              </button>

              {/* Imagen ampliada */}
              <div
                className="relative overflow-hidden rounded-lg"
                onClick={e => e.stopPropagation()} // Evita que se cierre al hacer clic en la imagen
              >
                <img
                  src={`${API_URL}/uploads/event_photos/${expandedPhoto.filename}`}
                  alt={`Foto ampliada del evento ${event.title}`}
                  className="w-full h-auto max-h-[85vh] object-contain bg-black"
                />

                {/* Información del usuario y botón de favorito */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{expandedPhoto.user?.username || "Usuario"}</p>
                      <p className="text-sm text-gray-200">{new Date(expandedPhoto.created_at).toLocaleDateString()}</p>
                    </div>

                    {/* Botón de favorito en vista ampliada */}
                    {token && (
                      <button
                        onClick={(e) => toggleFavorite(expandedPhoto.id, e)}
                        className="text-white hover:text-pink-400 transition-colors p-2"
                      >
                        {photoFavorites[expandedPhoto.id] ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardDetail;