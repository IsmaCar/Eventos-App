import React, { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const API_URL = import.meta.env.VITE_API_URL;

function Profile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isMainProfile = location.pathname === '/profile'; // Verificar si estamos en la ruta principal
  const [stats, setStats] = useState({
    eventsCreated: 0,
    friendRequests: 0,
    invitationsPending: 0,
  });
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriendRequests, setShowFriendRequests] = useState(false); // Estado para controlar la visibilidad del modal

  // Resto de funciones fetch...

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las estadísticas');
      }

      const data = await response.json();

      setStats({
        eventsCreated: data.eventsCreated || 0,
        friendRequests: data.friendRequests || 0,
        invitationsPending: data.invitationsPending || 0
      });
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      setStats({
        eventsCreated: user.eventsCreated || 0,
        friendRequests: 0,
        invitationsPending: 0
      });
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los amigos');
      }

      const data = await response.json();
      setFriends(data.friends || []);
    } catch (err) {
      console.error('Error obteniendo amigos:', err);
      setFriends([]);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends/requests/received`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las solicitudes de amistad');
      }

      const data = await response.json();
      setFriendRequests(data.requests || []);
      // Actualizar también el contador en las estadísticas
      setStats(prev => ({...prev, friendRequests: data.requests?.length || 0}));
    } catch (err) {
      console.error('Error obteniendo solicitudes de amistad:', err);
      setFriendRequests([]);
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/accept/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al aceptar la solicitud');
      }

      // Actualizar la lista de solicitudes y amigos
      fetchFriendRequests();
      fetchFriends();
    } catch (err) {
      console.error('Error aceptando solicitud:', err);
      alert('No se pudo aceptar la solicitud de amistad');
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al rechazar la solicitud');
      }

      // Actualizar la lista de solicitudes
      fetchFriendRequests();
    } catch (err) {
      console.error('Error rechazando solicitud:', err);
      alert('No se pudo rechazar la solicitud de amistad');
    }
  };

  useEffect(() => {
    !token ? navigate('/login') : null;
    if (user && token) {
      setLoading(true);
      Promise.all([
        fetchUserStats(),
        fetchFriends(),
        fetchFriendRequests()
      ]).finally(() => setLoading(false));
    }
  }, [user, token]);

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

  // Construir URL completa del avatar
  const avatarUrl = user.avatar
    ? `${API_URL}/uploads/avatars/${user.avatar}`
    : `${API_URL}/uploads/avatars/default-avatar.png`;
    
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
      {/* Modal para solicitudes de amistad */}
      {showFriendRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Solicitudes de amistad</h3>
              <button 
                onClick={() => setShowFriendRequests(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-fuchsia-500"></div>
                </div>
              ) : friendRequests.length > 0 ? (
                <div className="space-y-3">
                  {friendRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400">
                          {request.senderUser?.avatar ? (
                            <img
                              src={`${API_URL}/uploads/avatars/${request.senderUser.avatar}`}
                              alt={`Avatar de ${request.senderUser.username}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                              {request.senderUser?.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-800 font-medium">{request.senderUser?.username}</p>
                          <p className="text-gray-500 text-xs">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptFriendRequest(request.id)}
                          className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title="Aceptar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRejectFriendRequest(request.id)}
                          className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="Rechazar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">No tienes solicitudes de amistad pendientes</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowFriendRequests(false)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="mt-2 text-gray-600">
              Miembro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'hace tiempo'}
            </p>
          </div>
        </div>

        {/* Secciones adicionales */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Estadísticas */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Estadísticas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-fuchsia-600">{stats.eventsCreated || 0}</p>
                <p className="text-gray-500 text-sm">Eventos creados</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-fuchsia-600">{stats.friendRequests || 0}</p>
                <p className="text-gray-500 text-sm">Solicitudes de amistad</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg col-span-2">
                <p className="text-2xl font-bold text-fuchsia-600">{stats.invitationsPending || 0}</p>
                <p className="text-gray-500 text-sm">Invitaciones pendientes</p>
              </div>
            </div>
          </div>

          {/* Lista de amigos - SIN botón de buscar amigos */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Mis amigos
            </h2>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fuchsia-500"></div>
              </div>
            ) : friends.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {friends.map(friend => (
                    <li key={friend.id} className="py-2">
                      <Link to={`/profile/${friend.id}`} className="flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors">
                        {/* Avatar del amigo */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex-shrink-0">
                          {friend.avatar ? (
                            <img
                              src={`${API_URL}/uploads/avatars/${friend.avatar}`}
                              alt={`Avatar de ${friend.username}`}
                              className="w-full h-full object-cover"
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aún no tienes amigos</p>
                <p className="text-sm mt-2">Agrega amigos para verlos aquí</p>
              </div>
            )}
            {/* Botón "Buscar amigos" eliminado */}
          </div>

          {/* Acciones rápidas - Con botón de solicitudes de amistad */}
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
              <Link
                to="my-events"
                className="flex w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Mis eventos
              </Link>
              <Link
                to="invitations"
                className="flex w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Invitaciones a eventos
                {stats.invitationsPending > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-fuchsia-500 rounded-full">
                    {stats.invitationsPending}
                  </span>
                )}
              </Link>
              
              {/* Botón para mostrar solicitudes de amistad */}
              <button
                onClick={() => setShowFriendRequests(true)}
                className="flex w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Solicitudes de amistad
                {stats.friendRequests > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-fuchsia-500 rounded-full">
                    {stats.friendRequests}
                  </span>
                )}
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