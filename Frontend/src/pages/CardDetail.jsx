/**
 * Página de detalle de un evento
 * 
 * Muestra la información completa de un evento incluyendo:
 * - Detalles básicos (título, fecha, ubicación)
 * - Lista de asistentes
 * - Gestión de invitaciones (para creadores)
 * - Galería de fotos con funcionalidad de favoritos
 * - Acciones específicas según el rol del usuario
 */
import React, { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LocationPicker } from '../components/Maps'
import InviteUsers from '../components/InviteUsers'
import EventInvitationOrganizer from '../components/EventInvitationOrganizer'
import Spinner from '../components/Spinner'
import { useEventDetails } from '../hooks/useEventDetails'
import { useEventAttendees } from '../hooks/useEventAttends'
import { usePhotoUploads } from '../hooks/usePhotoUploads'
import { useToast } from '../hooks/useToast'

const API_URL = import.meta.env.VITE_API_URL;

function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState('invite')
  const toast = useToast()

  // Hook para los detalles del evento
  const { event, loading, error, getImageUrl, photos, loadingPhotos, photoFavorites,
    toggleFavorite, fetchEventPhotos, formatDate } = useEventDetails(id);

  const isEventCreator = useCallback(() => {
    if (!user || !event) return false;

    const currentUserId = parseInt(user.id, 10);
    const eventUserId = parseInt(event.user_id, 10);

    return !isNaN(eventUserId) && currentUserId === eventUserId;
  }, [user, event]);

  // Hook personalizado para gestionar los asistentes al evento
  const { attendees, loadingAttendees, processingAction, isCurrentUserAttending,
    isAttendeeOrganizer, cancelAttendance, confirmCancelAttendance, showCancelConfirmation,
    setShowCancelConfirmation, removeAttendee } = useEventAttendees(id, isEventCreator());

  
  // Hook personalizado para gestionar la galería de fotos del evento
  const { selectedFile, uploadError, uploading, handleFileChange, clearSelectedFile,
    deletingPhotoId, canDeletePhoto, deletePhoto, expandedPhoto, openExpandedView,
    closeExpandedView, maxFileSize, allowedTypesFormatted, handleUploadPhoto,    
    handleDownloadPhoto } = usePhotoUploads(id, isEventCreator(), fetchEventPhotos, navigate);


  const [deletingEvent, setDeletingEvent] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);  
  /**
   * Inicia el proceso de confirmación para eliminar evento
   */
  const handleRequestDeleteEvent = () => {
    setShowDeleteConfirmation(true);
  };

  /**
   * Maneja la eliminación completa de un evento
   * Solo disponible para el creador del evento
   */
  const handleDeleteEvent = async () => {
    if (!token || !isEventCreator()) return;

    try {
      setDeletingEvent(true);      
      const response = await fetch(`${API_URL}/api/event/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el evento');
      }

      // Éxito: mostrar mensaje y redirigir a la página de inicio
      toast.success('Evento eliminado correctamente');
      navigate('/');
    } catch (error) {
      console.error("Error eliminando el evento:", error);
      toast.error('Error: ' + error.message);
    } finally {
      setDeletingEvent(false);
      setShowDeleteConfirmation(false);
    }
  };

   /**
   * Maneja la eliminación de una foto con confirmación mediante Toast
   */
  const handleDeletePhoto = async (photoId, e) => {
    toast.warning('Eliminando foto...', { duration: 1000 });
    
    // Pequeño delay para que el usuario vea el mensaje
    setTimeout(async () => {
      await deletePhoto(photoId, photos, e);
    }, 500);
  };

  /**
   * Callback que se ejecuta cuando se envía una invitación exitosamente
   * Cambia automáticamente a la pestaña de gestión para ver la invitación enviada
   */
  const handleInvitationSent = () => {
    setActiveTab('manage');
  };

  if (loading) {
    return <Spinner containerClassName="h-96" color="indigo" text="Cargando evento..." />
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
      <header
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
            )}          </div>
        </div>
      </header>
      {/* Contenido con padding */}
      <main className="p-6">        
        {/* Botón para eliminar evento - solo visible para el creador */}
        {isEventCreator() && (
          <aside className="flex justify-end mb-6">
            <button
              onClick={handleRequestDeleteEvent}
              disabled={deletingEvent}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
            >
              {deletingEvent ? (
                <>
                  <Spinner size="xs" color="white" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar evento</span>
                </>
              )}            
              </button>
          </aside>
        )}        
        {/* Detalles principales */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
          {/* Fecha - más pequeña */}
          <article className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-6 rounded-lg border border-fuchsia-100 shadow-sm md:col-span-3">
            <h3 className="font-semibold text-fuchsia-600 mb-2">Fecha</h3>
            <p className="text-gray-700">{formatDate(event.event_date)}</p>
            {event.time && <p className="text-gray-700 mt-1">{event.time}</p>}
            <div className="mt-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Acerca de este evento</h2>
              <div
                className="max-h-60 overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d8b4fe #f0f0f0'
                }}
              >
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>              </div>
            </div>
          </article>          
          {/* Ubicación - más pequeña */}
          <section className="bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-6 rounded-lg border border-fuchsia-100 shadow-sm md:col-span-5">
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
          </section>          
          {/* Lista de asistentes */}
          <section className="bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-6 rounded-lg border border-indigo-100 shadow-sm md:col-span-4">
            <h3 className="font-semibold text-indigo-600 mb-3">Asistentes</h3>

            {loadingAttendees ? (
              <Spinner size="sm" color="indigo" containerClassName="py-6" />
            ) : attendees.length > 0 ? (
              <div className="max-h-80 overflow-y-auto pr-2">
                <ul className="divide-y divide-gray-200">
                  {attendees.map((attendee) => {
                    // Determinar si este asistente es el usuario actual
                    const isCurrentUser = user && parseInt(user.id) === parseInt(attendee.id);
                    // Determinar si este asistente es el organizador del evento
                    const isOrganizerOfEvent = isAttendeeOrganizer(attendee.id);
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
                                onError={(e) => {
                                  e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                                  e.target.onerror = null;
                                }}
                              />
                            </div>

                            {/* Nombre de usuario */}
                            <span className="text-gray-700 font-medium">
                              {attendee.username}
                              {isCurrentUser && <span className="ml-1 text-xs text-indigo-500">(Tú)</span>}
                            </span>

                            {/* Indicador de organizador */}
                            {isOrganizerOfEvent && (
                              <span className="ml-auto text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                                Organizador
                              </span>
                            )}
                          </Link>

                          <div className="flex gap-2">
                            {/* Botón para cancelar asistencia - solo para el usuario actual que no sea organizador */}
                            {isCurrentUser && !isOrganizerOfEvent && (
                              <button
                                onClick={cancelAttendance}
                                disabled={processingAction}
                                className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-full transition-colors flex items-center"
                                title="Cancelar asistencia"
                              >
                                {processingAction ? (
                                  <Spinner size="xs" color="red" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                no asistiré
                              </button>
                            )}

                            {/* Botón para que el organizador elimine asistentes que no sean él mismo */}
                            {isEventCreator() && !isOrganizerOfEvent && !isCurrentUser && (
                              <button
                                onClick={() => removeAttendee(attendee.id)}
                                disabled={processingAction}
                                className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-full transition-colors flex items-center"
                                title="Eliminar asistente"
                              >
                                {processingAction ? (
                                  <Spinner size="xs" color="red" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                                eliminar
                              </button>
                            )}
                          </div>
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
          </section>
        </section>        {/* SECCIÓN DE INVITACIONES (solo para el creador del evento) */}
        {isEventCreator() && (
          <section className="mt-12 border-t pt-8">
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
                  <EventInvitationOrganizer eventId={id} />
                )}              </div>
            </div>
          </section>
        )}        
        {/* SECCIÓN: FOTOS DEL EVENTO */}
        <section className="mt-12 border-t pt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Fotos del evento</h2>
          </div>         
          {/* Subir nueva foto */}
          {token && (
            <form className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
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
              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}              <p className="mt-2 text-xs text-gray-500">
                Formatos permitidos: {allowedTypesFormatted}. Tamaño máximo: {(maxFileSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </form>
          )}
          {/* Mostrar fotos con botones de acción */}
          <div className="mt-6">
            {loadingPhotos ? (
              <Spinner size="md" color="indigo" containerClassName="py-10" text="Cargando fotos..." />
            ) : photos.length > 0 ? (              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {photos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="relative group overflow-hidden rounded-lg shadow-md aspect-square cursor-pointer"
                    onClick={() => openExpandedView(photo)}
                  >
                    <img
                      src={`${API_URL}/uploads/event_photos/${photo.filename}`}
                      alt={`Foto de ${event.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <figcaption className="flex justify-between items-center mb-1">
                        <p className="text-white text-sm font-medium">{photo.user?.username || "Usuario"}</p>
                        {/* Botones de acción para la foto */}
                        <div className="flex space-x-2">
                          {/* Botón para marcar/desmarcar favorito */}
                          {token && (
                            <button
                              onClick={(e) => toggleFavorite(photo.id, e)}
                              className="text-white hover:text-pink-400 transition-colors"
                              title={photoFavorites[photo.id] ? "Quitar de favoritos" : "Añadir a favoritos"}
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
                          {/* Botón para descargar la foto */}
                          <button
                            onClick={(e) => handleDownloadPhoto(photo, event?.title, e)}
                            className="text-white hover:text-blue-300 transition-colors"
                            title="Descargar foto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          {/* Botón para eliminar la foto (solo para el propietario o el organizador) */}
                          {token && canDeletePhoto(photo) && (
                            <button
                              onClick={(e) => handleDeletePhoto(photo.id, e)}
                              className="text-white hover:text-red-400 transition-colors"
                              title="Eliminar foto"
                              disabled={deletingPhotoId === photo.id}
                            >
                              {deletingPhotoId === photo.id ? (
                                <Spinner size="xs" color="white" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          )}                        
                          </div>
                      </figcaption>                      
                      <p className="text-gray-200 text-xs">{new Date(photo.created_at).toLocaleDateString()}</p>
                    </div>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aún no hay fotos para este evento. ¡Sé el primero en compartir una!</p>
              </div>            )}
          </div>
        </section>
        {/* Modal para vista ampliada con botones de acción */}
        {expandedPhoto && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeExpandedView}
          >
            <div className="relative max-w-5xl max-h-[90vh] w-full">              
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
                {/* Información del usuario y botones de acción */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{expandedPhoto.user?.username || "Usuario"}</p>
                      <p className="text-sm text-gray-200">{new Date(expandedPhoto.created_at).toLocaleDateString()}</p>
                    </div>
                    {/* Botones de acción en vista ampliada */}
                    <div className="flex items-center space-x-4">
                      {/* Botón de favorito */}
                      {token && (
                        <button
                          onClick={(e) => toggleFavorite(expandedPhoto.id, e)}
                          className="text-white hover:text-pink-400 transition-colors p-2"
                          title={photoFavorites[expandedPhoto.id] ? "Quitar de favoritos" : "Añadir a favoritos"}
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
                      {/* Botón para descargar foto */}
                      <button
                        onClick={(e) => handleDownloadPhoto(expandedPhoto, event?.title, e)}
                        className="text-white hover:text-blue-300 transition-colors p-2"
                        title="Descargar foto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {/* Botón para eliminar foto (solo para propietario o creador) */}
                      {token && canDeletePhoto(expandedPhoto) && (
                        <button
                          onClick={() => handleDeletePhoto(expandedPhoto.id)}
                          className="text-white hover:text-red-400 transition-colors p-2"
                          title="Eliminar foto"
                          disabled={deletingPhotoId === expandedPhoto.id}
                        >
                          {deletingPhotoId === expandedPhoto.id ? (
                            <Spinner size="sm" color="white" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>          
            </div>
        )}
      </main>

      {/* Modal de confirmación para eliminar evento */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar evento</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar el evento "<strong>{event.title}</strong>"? 
              Perderás todas las fotos que no esten guardadas, invitaciones y datos asociados.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={deletingEvent}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deletingEvent}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center space-x-2 transition-colors"
              >
                {deletingEvent ? (
                  <>
                    <Spinner size="xs" color="white" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Eliminar evento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para cancelar asistencia */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancelar asistencia</h3>
                <p className="text-sm text-gray-500">Confirma que no asistirás al evento</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas cancelar tu asistencia al evento "<strong>{event.title}</strong>"?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                disabled={processingAction}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Mantener asistencia
              </button>
              <button
                onClick={confirmCancelAttendance}
                disabled={processingAction}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center space-x-2 transition-colors"
              >
                {processingAction ? (
                  <>
                    <Spinner size="xs" color="white" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>No asistiré</span>
                  </>
                )}
              </button>
            </div>
          </div>        
        </div>
      )}
    </div>
  );
}

export default CardDetail;