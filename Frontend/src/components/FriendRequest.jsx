import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

function FriendRequests({ onRequestProcessed }) {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
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
      setRequests(data.requests || []);
      setError(null);
    } catch (err) {
      setError("Error al cargar las solicitudes");
      setRequests([]);
    } finally {
      setLoading(false);
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

      // Actualizar la lista de solicitudes localmente
      setRequests(prevRequests => 
        prevRequests.filter(request => request.id !== requestId)
      );
      
      // Notificar al componente padre que se procesó una solicitud
      if (typeof onRequestProcessed === 'function') {
        onRequestProcessed();
      }
    } catch (err) {
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

      // Actualizar la lista de solicitudes localmente
      setRequests(prevRequests => 
        prevRequests.filter(request => request.id !== requestId)
      );
      
      // Notificar al componente padre que se procesó una solicitud
      if (typeof onRequestProcessed === 'function') {
        onRequestProcessed();
      }
    } catch (err) {
      alert('No se pudo rechazar la solicitud de amistad');
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriendRequests();
    }
  }, [token]);

  const handleDefaultAvatarError = (e) => {
    e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
    e.target.onerror = null;
  };

  // Función para formatear fechas correctamente
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      // Formatear fecha (día/mes/año)
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  // Función para obtener el nombre de usuario o un valor por defecto
  const getUsername = (user) => {
    if (!user) return 'Usuario desconocido';
    return user.username || 'Sin nombre';
  };

  // Función para obtener la inicial del nombre de usuario
  const getUserInitial = (user) => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl p-4">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-fuchsia-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchFriendRequests}
            className="mt-4 px-4 py-2 bg-fuchsia-100 text-fuchsia-700 rounded-md hover:bg-fuchsia-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex-shrink-0">
                  {request.requester && request.requester.avatar ? (
                    <img
                      src={`${API_URL}/uploads/avatars/${request.requester.avatar}`}
                      alt={`Avatar de ${getUsername(request.requester)}`}
                      className="w-full h-full object-cover"
                      onError={handleDefaultAvatarError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                      {getUserInitial(request.requester)}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">{getUsername(request.requester)}</p>
                  <p className="text-gray-500 text-sm">{formatDate(request.created_at)}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptFriendRequest(request.id)}
                  className="px-4 py-2 bg-fuchsia-600 text-white text-sm rounded-md hover:bg-fuchsia-700 transition-colors"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleRejectFriendRequest(request.id)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                >
                  Rechazar
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
  );
}

export default FriendRequests;