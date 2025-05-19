import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Hook personalizado para gestión de amigos
 * @param {Object} options - Opciones de configuración
 * @param {string} options.friendsEndpoint - Endpoint para obtener amigos
 * @param {string} options.requestEndpoint - Endpoint para enviar solicitudes
 * @param {string} options.acceptEndpoint - Endpoint para aceptar solicitudes
 * @param {Function} options.onFriendsLoaded - Callback cuando se cargan amigos
 * @param {Function} options.onRequestSent - Callback cuando se envía solicitud
 * @param {Function} options.onRequestAccepted - Callback cuando se acepta solicitud
 * @param {Function} options.refreshCallback - Función para refrescar datos externos
 */
export const useFriends = (options = {}) => {
  const {
    friendsEndpoint = '/api/friends',
    requestEndpoint = '/api/friends/request',
    acceptEndpoint = '/api/friends/accept',
    onFriendsLoaded = null,
    onRequestSent = null,
    onRequestAccepted = null,
    refreshCallback = null
  } = options;

  const { token } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Obtiene la lista de amigos del usuario
   */
  const fetchFriends = async () => {
    if (!token) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}${friendsEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los amigos');
      }

      const data = await response.json();
      const friendsList = data.friends || [];
      
      setFriends(friendsList);
      
      if (onFriendsLoaded) {
        onFriendsLoaded(friendsList);
      }
      
      return friendsList;
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar los amigos';
      setError(errorMessage);
      setFriends([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envía una solicitud de amistad a un usuario
   * @param {string} userId - ID del usuario al que enviar la solicitud
   */
  const sendFriendRequest = async (userId) => {
    if (!token || !userId) {
      return { success: false, error: 'Datos de solicitud incompletos' };
    }
    
    try {
      const response = await fetch(`${API_URL}${requestEndpoint}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la solicitud');
      }

      // Ejecutar callback si existe
      if (refreshCallback) {
        refreshCallback();
      }
      
      // Ejecutar callback específico si existe
      if (onRequestSent) {
        onRequestSent(userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error al enviar solicitud de amistad:', error);
      return { 
        success: false, 
        error: error.message || 'Error al enviar la solicitud'
      };
    }
  };

  /**
   * Acepta una solicitud de amistad
   * @param {string} requestId - ID de la solicitud a aceptar
   */
  const acceptFriendRequest = async (requestId) => {
    if (!token || !requestId) {
      return { success: false, error: 'ID de solicitud no válido' };
    }
    
    try {
      const response = await fetch(`${API_URL}${acceptEndpoint}/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al aceptar la solicitud');
      }

      // Actualizar lista de amigos
      await fetchFriends();
      
      // Ejecutar callback general si existe
      if (refreshCallback) {
        refreshCallback();
      }
      
      // Ejecutar callback específico si existe
      if (onRequestAccepted) {
        onRequestAccepted(requestId);
      }

      return { success: true };
    } catch (err) {
      console.error('Error al aceptar solicitud de amistad:', err);
      return { 
        success: false, 
        error: err.message || 'Error al aceptar la solicitud'
      };
    }
  };

  // Cargar amigos al montar el componente si hay token
  useEffect(() => {
    if (token) {
      fetchFriends();
    }
  }, [token]);

  return {
    friends,
    loading,
    error,
    fetchFriends,
    sendFriendRequest,
    acceptFriendRequest
  };
};

export default useFriends;