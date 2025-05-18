import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, getImageUrl, getRandomGradient } from '../utils/Imagehelper';

const API_URL = import.meta.env.VITE_API_URL;

function PublicProfile() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [friendshipId, setFriendshipId] = useState(null);

  // Función para enviar solicitud de amistad
  const handleFriendRequest = async () => {
    if (!token) {
      alert('Debes iniciar sesión para enviar solicitudes de amistad');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('No se pudo enviar la solicitud de amistad');
      }
      
      setFriendRequestStatus('pending');
      alert('Solicitud de amistad enviada correctamente');
    } catch (error) {
      console.error('Error enviando solicitud de amistad:', error);
      alert('Error al enviar solicitud de amistad');
    }
  };

  // Función para eliminar amistad
  const handleRemoveFriend = async () => {
    if (!token || !friendshipId) {
      alert('No se puede eliminar la amistad en este momento');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar a esta persona de tus amigos?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('No se pudo eliminar la amistad');
      }
      
      setFriendRequestStatus('none');
      setFriendshipId(null);
      setFriends(friends.filter(friend => friend.id !== parseInt(id)));
      
      alert('Amistad eliminada correctamente');
    } catch (error) {
      console.error('Error eliminando amistad:', error);
      alert('Error al eliminar la amistad');
    }
  };

  // Cargar datos del perfil y estado de amistad
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
        setEvents(eventsData.events || []);
        
        // Obtener amigos del usuario
        try {
          const friendsResponse = await fetch(`${API_URL}/api/friends/user/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            setFriends(friendsData.friends || []);
            
            if (user && friendsData.friends && friendsData.friends.length > 0) {
              const isCurrentUserFriend = friendsData.friends.some(
                friend => friend.id === parseInt(user.id) || friend.user_id === parseInt(user.id)
              );
              
              if (isCurrentUserFriend) {
                setFriendRequestStatus('friends');
                
                const friendship = friendsData.friends.find(
                  friend => friend.id === parseInt(user.id) || friend.user_id === parseInt(user.id)
                );
                
                if (friendship && friendship.friendship_id) {
                  setFriendshipId(friendship.friendship_id);
                }
              }
            }
          } else {
            setFriends([]);
          }
        } catch (err) {
          console.warn("Error al obtener amigos:", err);
          setFriends([]);
        }

        // Verificar el estado de la solicitud de amistad (si el usuario está autenticado)
        if (token && user && user.id !== parseInt(id)) {
          try {
            const friendStatusResponse = await fetch(`${API_URL}/api/friends/check/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (friendStatusResponse.ok) {
              const statusData = await friendStatusResponse.json();
              
              if (statusData.status === 'friends' || statusData.status === 'accepted') {
                setFriendRequestStatus('friends');
                const fId = statusData.friendship_id || statusData.id || statusData.friendshipId;
                if (fId) {
                  setFriendshipId(fId);
                }
              } else {
                setFriendRequestStatus(statusData.status || 'none');
              }
            }
          } catch (err) {
            console.warn("Error al verificar estado de amistad:", err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setError(`No se pudo cargar el perfil: ${err.message}`);
        setLoading(false);
      }
    }
    
    loadProfileData();
  }, [id, token, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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
                <p className="mt-2 text-gray-600">
                  Miembro desde {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'hace tiempo'}
                </p>
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

        {/* Secciones adicionales */}
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
              <div className="max-h-60 overflow-y-auto">
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay amigos para mostrar</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección de eventos del usuario */}
        <div className="mt-8 bg-white shadow-md rounded-xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Eventos creados</h2>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {events.length} evento{events.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">Este usuario aún no ha creado eventos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <Link 
                  to={`/event/${event.id}`} 
                  key={event.id}
                  className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    {event.image ? (
                      <div 
                        className="h-48 bg-cover bg-center" 
                        style={{ backgroundImage: `url(${getImageUrl(`/uploads/backgrounds/${event.image}`)})` }}
                      ></div>
                    ) : (
                      <div className={`h-48 ${getRandomGradient()} flex items-center justify-center`}>
                        <span className="text-white text-xl">📷</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-sm font-medium">
                        {new Date(event.event_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-lg mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>
                    {event.location && (
                      <div className="flex items-center text-gray-500 text-xs">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="truncate">
                          {typeof event.location === 'string' 
                            ? event.location 
                            : event.location?.address || 'Ubicación disponible'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;