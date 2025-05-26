/**
 * Página Profile - Panel de control del usuario autenticado
 * Gestiona perfil personal, amigos, notificaciones y eventos
 * Incluye pestañas dinámicas y modales para diferentes funcionalidades
 */
import React, { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getAvatarUrl, handleAvatarError, Avatar } from '../utils/Imagehelper';
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { useToast } from '../hooks/useToast'
import EventRequest from '../components/EventRequest'
import FriendRequests from '../components/FriendRequest'
import EventUser from '../components/EventsUser'
import Spinner from '../components/Spinner'
import useUserSearch from '../hooks/useUserSearch';
import { useFriends } from '../hooks/useFriends';

const API_URL = import.meta.env.VITE_API_URL;


function Profile() {
  const { user, token } = useAuth();
  const { stats, refreshNotifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const isMainProfile = location.pathname === '/profile';
  const [loading, setLoading] = useState(true);
  // Estado para modales
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showMyEvents, setShowMyEvents] = useState(false);

  // Determinar la pestaña activa basada en el parámetro de URL
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab');

  // Hook para búsqueda de usuarios
  const { searchTerm, searchResults, isSearching, handleSearchTermChange,
    updateUserInResults, resetSearch } = useUserSearch({
    endpoint: '/api/friends/search',
    paramName: 'term',
    minLength: 3,
    filterCurrentUser: true,
  });
  // Hook para gestión de amigos
  const { friends, fetchFriends, sendFriendRequest, acceptFriendRequest } = useFriends({
    refreshCallback: refreshNotifications,
    onRequestSent: (userId) => {
      // Actualizar UI para mostrar "Solicitud enviada" en los resultados
      updateUserInResults(userId, {
        friendship_status: 'requested',
        friendship_id: null
      });
      toast.success('Solicitud de amistad enviada');
    },
    onRequestAccepted: () => {
      // Actualizar la lista de amigos
      fetchFriends();
    }
  });
  // Función para abrir automáticamente la ventana adecuada según las notificaciones disponibles
  const handleOpenNotifications = async () => {
    // Obtener las notificaciones actualizadas directamente de la función
    const freshNotifications = await refreshNotifications();

    // Usar los datos devueltos para decidir qué modal abrir
    if (freshNotifications.friendRequests > 0) {
      setShowFriendRequests(true);
    } else if (freshNotifications.invitationsPending > 0) {
      setShowInvitations(true);
    }
  };
  // Función para abrir el modal de invitaciones y actualizar estadísticas
  const handleOpenInvitations = () => {
    setShowInvitations(true);
    
    // Actualizamos las estadísticas al abrir el modal para tener datos actualizados
    refreshNotifications();
  };

  // Función para cerrar el modal de invitaciones y actualizar estadísticas
  const handleCloseInvitations = () => {
    setShowInvitations(false);
    // Actualizamos las estadísticas al cerrar el modal para reflejar los cambios
    refreshNotifications();
  };
  // Funciones para solicitudes de amistad
  const handleOpenFriendRequests = () => {
    setShowFriendRequests(true);
    refreshNotifications();
  };

  const handleCloseFriendRequests = () => {
    setShowFriendRequests(false);
    refreshNotifications();
  };

  // Manejador para cerrar modal de búsqueda
  const handleCloseFriendSearch = () => {
    setShowFriendSearch(false);
    resetSearch();
  };
  /**
   * Maneja el envío de solicitudes de amistad con retroalimentación al usuario
   */
  const handleSendFriendRequest = async (userId) => {
    const result = await sendFriendRequest(userId);
    if (!result.success) {
      toast.error(result.error || 'Error al enviar solicitud');
    }
  };

  /**
   * Maneja la aceptación de solicitudes de amistad
   */
  const handleAcceptFriendRequest = async (requestId) => {
    const result = await acceptFriendRequest(requestId);
    if (!result.success) {
      toast.error('No se pudo aceptar la solicitud de amistad');
    }
  };

  // Efecto para actualizar periódicamente cuando los modales están abiertos
  useEffect(() => {
    if (showFriendRequests || showInvitations) {
      const interval = setInterval(refreshNotifications, 3000);
      return () => clearInterval(interval);
    }
  }, [showFriendRequests, showInvitations, refreshNotifications]);

  // Efecto para detectar y abrir el modal correspondiente según la URL
  useEffect(() => {
    if (activeTab === 'requests') {
      // Verificar si debemos abrir el modal de notificaciones
      const shouldOpenNotificationsModal = localStorage.getItem('openNotificationsModal') === 'true';

      if (shouldOpenNotificationsModal) {
        // Llamamos a nuestra nueva función que decide qué ventana abrir
        handleOpenNotifications();

        // Limpiar la bandera para no volver a abrir automáticamente
        localStorage.removeItem('openNotificationsModal');
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user && token) {
      setLoading(true);
      fetchFriends().finally(() => setLoading(false));
    }
  }, [user, token, navigate]);

  const handleDefaultAvatarError = (e) => {
    e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
    e.target.onerror = null;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-red-500">No se pudo cargar tu perfil</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 bg-fuchsia-500 text-white py-2 px-4 rounded hover:bg-fuchsia-600"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  if (!isMainProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Barra de navegación para secciones anidadas */}
          <div className="mb-6 flex space-x-2">
            <Link to="/profile" className="px-4 py-2 bg-white rounded-md shadow hover:bg-gray-50">
              ← Volver al perfil
            </Link>
          </div>

          {/* Contenedor para el componente anidado */}
          <div>
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 relative">
      {/* Modal para búsqueda de amigos */}
      {showFriendSearch && (
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-white/95 rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Buscar amigos</h3>
              <button
                onClick={handleCloseFriendSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-500 transition-colors"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {searchTerm.length > 0 && searchTerm.length < 3 && (
                <p className="text-xs text-gray-500 mt-1">Ingresa al menos 3 caracteres para buscar</p>
              )}
            </div>

            {/* Resultados de búsqueda */}
            <div className="overflow-y-auto flex-1">
              {isSearching ? (
                <div className="py-10">
                  <Spinner size="md" color="fuchsia" />
                </div>
              ) : searchTerm.length >= 3 ? (
                searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Avatar
                            user={user}
                            size="md"
                          />
                          <div className="ml-3">
                            <p className="text-gray-800 font-medium">{user.username}</p>
                          </div>
                        </div>
                        <div>
                          {user.friendship_status === 'none' && (
                            <button
                              onClick={() => handleSendFriendRequest(user.id)}
                              className="py-1.5 px-3 bg-fuchsia-500 text-white rounded hover:bg-fuchsia-600 transition-colors text-sm"
                            >
                              Enviar solicitud
                            </button>
                          )}
                          {user.friendship_status === 'requested' && (
                            <span className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded text-sm">
                              Solicitud enviada
                            </span>
                          )}
                          {user.friendship_status === 'pending' && (
                            <button
                              onClick={() => handleAcceptFriendRequest(user.friendship_id)}
                              className="py-1.5 px-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                            >
                              Aceptar solicitud
                            </button>
                          )}
                          {user.friendship_status === 'friends' && (
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm">
                              Ya sois amigos
                            </span>
                          )}
                          {user.friendship_status === 'rejected' && (
                            <button
                              onClick={() => handleSendFriendRequest(user.id)}
                              className="py-1.5 px-3 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm"
                            >
                              Volver a enviar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500">No se encontraron usuarios</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Busca usuarios por nombre o email</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={handleCloseFriendSearch}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para invitaciones a eventos */}
      {showInvitations && (
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-white/95 rounded-xl shadow-lg w-full max-w-xl p-6 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Invitaciones a eventos</h3>
              <button
                onClick={() => handleCloseInvitations()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <EventRequest onInvitationProcessed={refreshNotifications} />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleCloseInvitations()}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para solicitudes de amistad */}
      {showFriendRequests && (
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-white/95 rounded-xl shadow-lg w-full max-w-xl p-6 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Solicitudes de amistad</h3>
              <button
                onClick={() => handleCloseFriendRequests()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <FriendRequests onRequestProcessed={refreshNotifications} />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleCloseFriendRequests()}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo Modal para mis eventos */}
      {showMyEvents && (
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-white/95 rounded-xl shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Mis Eventos</h3>
              <button
                onClick={() => setShowMyEvents(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <EventUser />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowMyEvents(false)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para "No hay notificaciones" */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Card principal */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Portada y Avatar */}
          <div className="relative">
            {/* Banner del perfil */}
            <div className="h-48 w-full bg-gradient-to-r from-fuchsia-500 to-indigo-500">
              <div className="w-full h-full bg-white/10 backdrop-blur-sm"></div>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-16 left-8 border-4 border-white rounded-full shadow-xl bg-white">
              <div className="w-24 h-24 rounded-full overflow-hidden">
                <img
                  src={avatarUrl}
                  alt={`Avatar de ${user.username}`}
                  className="w-full h-full object-cover"
                  onError={handleDefaultAvatarError}
                />
              </div>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="pl-8 pt-18 pb-6">
            <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Secciones adicionales */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Notificaciones (antes Estadísticas) */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Notificaciones
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleOpenFriendRequests()}
                className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex flex-col items-center justify-center"
              >
                <div className="flex items-center">
                  {stats.friendRequests > 0 && (
                    <span className="text-2xl font-bold text-fuchsia-600 mr-2">{stats.friendRequests}</span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {stats.friendRequests > 0 && (
                    <span className="ml-2 inline-flex h-3 w-3 bg-fuchsia-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">Solicitudes de amistad</p>
              </button>

              <button
                onClick={() => handleOpenInvitations()}
                className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex flex-col items-center justify-center"
              >
                <div className="flex items-center">
                  {stats.invitationsPending > 0 && (
                    <span className="text-2xl font-bold text-fuchsia-600 mr-2">{stats.invitationsPending}</span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  {stats.invitationsPending > 0 && (
                    <span className="ml-2 inline-flex h-3 w-3 bg-fuchsia-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">Invitaciones a eventos</p>
              </button>
            </div>
          </div>

          {/* Lista de amigos */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Mis amigos
            </h2>
            {loading ? (
              <div className="py-4">
                <Spinner size="sm" color="fuchsia" />
              </div>
            ) : friends.length > 0 ? (
              <>
                {/* Contenedor con altura fija y desplazamiento personalizado */}
                <div
                  className={`overflow-y-auto scrollbar-thin scrollbar-thumb-fuchsia-300 scrollbar-track-gray-100 rounded
                   ${friends.length > 2 ? 'max-h-[160px]' : ''}`}
                >
                  <ul className="divide-y divide-gray-100">
                    {friends.map(friend => (
                      <li key={friend.friendship_id} className="py-2">
                        <Link to={`/profile/${friend.user_id}`} className="flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                          {/* Avatar del amigo */}
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex-shrink-0">
                            {friend.avatar ? (
                              <img
                                src={`${API_URL}/uploads/avatars/${friend.avatar}`}
                                alt={`Avatar de ${friend.username}`}
                                className="w-full h-full object-cover"
                                onError={handleDefaultAvatarError}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                                {friend.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="ml-3 text-gray-700">{friend.username}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Indicador de desplazamiento (solo visible si hay más de 2 amigos) */}
                {friends.length > 2 && (
                  <div className="flex justify-center mt-2 mb-3">
                    <span className="text-xs text-gray-400 flex items-center">
                      Desliza para ver más
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aún no tienes amigos</p>
                <p className="text-sm mt-2">Agrega amigos para verlos aquí</p>
              </div>
            )}

            {/* Botón para buscar amigos */}
            <button
              onClick={() => setShowFriendSearch(true)}
              className="mt-3 w-full py-2 px-4 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-600 rounded-md font-medium transition flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Buscar amigos
            </button>
          </div>

          {/* Acciones rápidas - Con elementos reducidos */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Acciones rápidas
            </h2>
            <div className="space-y-3">
              <Link
                to="edit-profile"
                className="flex w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Editar perfil
              </Link>

              {/* Botón para mostrar modal de mis eventos */}
              <button
                onClick={() => setShowMyEvents(true)}
                className="flex w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Mis eventos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* El Outlet está fuera de las tarjetas */}
      <div className="mt-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
}

export default Profile;