/**
 * Página para mostrar el perfil público de un usuario
 * Permite ver información, eventos creados, lista de amigos 
 * y gestionar la relación de amistad
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { useToast } from '../hooks/useToast';
import { Avatar, getRandomGradient } from '../utils/Imagehelper';
import { formatLongDate, isDatePassed } from '../utils/DateHelper';
import Spinner from '../components/Spinner';
import { useFriends } from '../hooks/useFriends';

const API_URL = import.meta.env.VITE_API_URL;


function PublicProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { getImageUrl } = useEvent();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [friendshipId, setFriendshipId] = useState(null);
  const [isRequester, setIsRequester] = useState(false);

  // Utilizar el hook de amigos con un callback de actualización
  const { sendFriendRequest, removeFriend, checkFriendshipStatus, findFriendshipId
  } = useFriends({
    refreshCallback: async () => {
      // Opcional: actualizar el estado de amistad tras operaciones
      if (token && id) {
        const statusData = await checkFriendshipStatus(id);
        if (statusData.status) {
          setFriendRequestStatus(statusData.status);
        }
      }
    }
  });

  /**
   * Efecto para cargar los datos del perfil al montar el componente
   * o cuando cambia el ID del usuario, token o usuario actual
   */
  useEffect(() => {
    async function loadProfileData() {
      if (!id) {
        setError("ID de usuario no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Obtener perfil público
        const profileResponse = await fetch(`${API_URL}/api/public/user/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (!profileResponse.ok) {
          throw new Error(`Error al cargar perfil: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setProfile(profileData.user);

        // Obtener eventos públicos del usuario
        const eventsResponse = await fetch(`${API_URL}/api/public/user/${id}/events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!eventsResponse.ok) {
          throw new Error(`Error al cargar eventos: ${eventsResponse.status}`);
        }

        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events);

        // Si el usuario está autenticado, obtener amigos y estado de amistad
        if (token) {
          try {
            // Obtener lista de amigos del usuario
            const friendsResponse = await fetch(`${API_URL}/api/friends/user/${id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            if (friendsResponse.ok) {
              const friendsData = await friendsResponse.json();
              setFriends(friendsData.friends || []);
            }
          } catch (friendsError) {
            // Silenciar error - no impide ver el resto del perfil
          }

          // Verificar estado de amistad si no es el perfil propio
          if (user && parseInt(user.id) !== parseInt(id)) {
            const statusData = await checkFriendshipStatus(id);

            if (statusData.status) {
              setFriendRequestStatus(statusData.status);
            }

            if (statusData.friendship_id) {
              setFriendshipId(statusData.friendship_id);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        setError(`No se pudo cargar el perfil: ${err.message}`);
        setLoading(false);
      }
    }

    loadProfileData();
  }, [id, token, user]);


  // Efecto para buscar el ID de amistad en la lista de amigos

  useEffect(() => {
    if (friends.length > 0 && !friendshipId && friendRequestStatus === 'friends') {
      const foundId = findFriendshipId(id);
      if (foundId) {
        setFriendshipId(foundId);
      }
    }
  }, [friends, friendRequestStatus, id]);

  /**
   * Maneja el envío de solicitudes de amistad
   * Actualiza el estado local y muestra notificaciones apropiadas
   */
  const handleFriendRequest = async () => {
    if (!token) {
      toast.error('Debes iniciar sesión para enviar solicitudes de amistad');
      return;
    }

    try {
      const result = await sendFriendRequest(id);

      if (result.success) {
        // Actualizar estado localmente
        setFriendRequestStatus('pending');

        // Verificar estado actualizado
        const statusData = await checkFriendshipStatus(id);
        if (statusData.status) {
          setFriendRequestStatus(statusData.status);
        }
        if (statusData.friendship_id) {
          setFriendshipId(statusData.friendship_id);
        }

        toast.success('Solicitud de amistad enviada correctamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error.message || 'Error al enviar solicitud de amistad');
    }
  };

  /**
   * Maneja la eliminación de una amistad existente
   * Solicita confirmación al usuario y actualiza el estado local
   */
  const handleRemoveFriend = async () => {
    // Obtener el ID de amistad (de estado o buscarlo en amigos)
    let idToUse = friendshipId || findFriendshipId(id);

    if (!idToUse) {
      toast.error('No se puede eliminar la amistad en este momento');
      return;
    }    // Solicitar confirmación para eliminar amistad
    const isConfirmed = confirm('¿Estás seguro de que quieres eliminar a esta persona de tus amigos?');
    if (!isConfirmed) {
      return;
    }

    try {
      // Usar directamente el método del hook para eliminar la amistad
      const result = await removeFriend(idToUse);

      if (result.success) {
        // Actualizar estado local
        setFriendRequestStatus('none');
        setFriendshipId(null);

        // Actualizar lista de amigos (filtrar el amigo eliminado)
        setFriends(prevFriends =>
          prevFriends.filter(friend =>
            (friend.id !== parseInt(id)) && (friend.user_id !== parseInt(id))
          )
        );

        toast.success('Amistad eliminada correctamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Error al eliminar la amistad: ' + error.message);
    }
  };

  /**
   * Maneja errores de carga de imágenes de eventos
   * Aplica un gradiente de respaldo y emoji decorativo
   */
  const handleEventImageError = (event) => {
    const target = event.target;
    target.parentElement.classList.add(getRandomGradient());
    target.parentElement.innerHTML = '<span class="text-white text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">🎉</span>';
  };

  // Mostrar spinner durante la carga
  if (loading) {
    return <Spinner containerClassName="h-screen" color="indigo" text="Cargando perfil..." />;
  }

  // Mostrar mensaje de error si hay problemas
  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || "No se encontró el perfil de usuario"}</p>
          <Link to="/" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 
                    rounded-full hover:from-purple-600 hover:to-indigo-600 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Determinar si mostrar el botón de amistad
  const isCurrentUser = user && parseInt(user.id) === parseInt(id);
  const showFriendButton = token && !isCurrentUser;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
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
              <Avatar user={profile} size="xl" />
            </div>
          </div>

          {/* Información del usuario */}
          <div className="pt-20 pl-8 pb-6 pr-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{profile.username}</h1>
                {/* Se eliminó la línea de "Miembro desde" */}
              </div>

              {/* Botón de añadir/eliminar amigo */}
              {showFriendButton && (
                <div>
                  {friendRequestStatus === 'friends' || friendRequestStatus === 'accepted' ? (
                    <button
                      onClick={handleRemoveFriend}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium flex items-center hover:bg-red-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Eliminar amigo
                    </button>
                  ) : friendRequestStatus === 'pending' ? (
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pendiente
                    </button>
                  ) : (
                    <button
                      onClick={handleFriendRequest}
                      className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white rounded-full font-medium flex items-center hover:from-fuchsia-600 hover:to-indigo-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Añadir amigo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secciones adicionales - Estadísticas y Amigos */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estadísticas - Eventos y Amigos */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Estadísticas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-fuchsia-600">{events.length || 0}</p>
                <p className="text-gray-500 text-sm">Eventos creados</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-fuchsia-600">{friends.length || 0}</p>
                <p className="text-gray-500 text-sm">Amigos</p>
              </div>
            </div>
          </div>

          {/* Lista de amigos */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Amigos
            </h2>
            {friends.length > 0 ? (
              <>
                {/* Contenedor con altura fija y desplazamiento personalizado */}
                <div
                  className={`overflow-y-auto scrollbar-thin scrollbar-thumb-fuchsia-300 scrollbar-track-gray-100 rounded
                    ${friends.length > 2 ? 'max-h-[160px]' : ''}`}
                >
                  <ul className="divide-y divide-gray-100">
                    {friends.map(friend => (
                      <li key={friend.id || friend.user_id} className="py-2">
                        <Link to={`/profile/${friend.id || friend.user_id}`} className="flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                          <Avatar
                            user={{
                              username: friend.username,
                              avatar: friend.avatar
                            }}
                            size="sm"
                          />
                          <span className="ml-3 text-gray-700">{friend.username}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Indicador de desplazamiento (solo visible si hay más de 2 amigos) */}
                {friends.length > 2 && (
                  <div className="flex justify-center mt-2">
                    <span className="text-xs text-gray-400 flex items-center">
                      Desliza para ver más
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                )}              </>
            ) : (
              <div className="text-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">Este usuario aún no tiene amigos</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección de eventos del usuario */}
        <div className="mt-8 bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Eventos creados
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">Este usuario aún no ha creado eventos.</p>
            </div>
          ) : (
            <div>
              {/* Contenedor con desplazamiento horizontal */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-fuchsia-300 scrollbar-track-gray-100 pb-4">
                <div className="flex gap-4" style={{ minWidth: 'min-content', width: '100%' }}>          {events.map(event => (
                  <div
                    key={event.id}
                    className="relative group rounded-lg overflow-hidden h-48 shadow-md flex-shrink-0"
                    style={{ width: '280px' }} // Ancho fijo para cada tarjeta
                  >
                    <div className="absolute inset-0 w-full h-full">
                      {event.image ? (
                        <div className="w-full h-full relative">
                          <img
                            src={getImageUrl(event.image)}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={handleEventImageError}
                          />
                        </div>
                      ) : (
                        <div className={`w-full h-full ${getRandomGradient()} flex items-center justify-center`}>
                          <span className="text-white text-4xl"></span>
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                      <div>
                        <h3 className="font-medium text-lg text-white line-clamp-1 drop-shadow-sm">{event.title}</h3>
                        <p className="text-gray-200 text-sm drop-shadow-sm">
                          {formatLongDate(event.event_date)}
                        </p>
                        {isDatePassed(event.event_date) && (
                          <span className="absolute top-4 right-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* Indicador de desplazamiento (solo visible si hay más de 3 eventos) */}
              {events.length > 3 && (
                <div className="flex justify-center mt-2">
                  <span className="text-xs text-gray-400 flex items-center">
                    Desliza para ver más
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;