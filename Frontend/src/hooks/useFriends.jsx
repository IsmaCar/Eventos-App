// Hook personalizado para gestión de amigos
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './useToast';

const API_URL = import.meta.env.VITE_API_URL;



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
  const { user, token } = useAuth();
  const toast = useToast();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [removeFriendId, setRemoveFriendId] = useState(null);

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


  // Envía una solicitud de amistad a un usuario
  const sendFriendRequest = async (userId) => {
    if (!token || !userId) {
      return { success: false, error: 'Datos de solicitud incompletos' };
    }

    // Validar que no se esté enviando solicitud a uno mismo
    if (user && user.id === parseInt(userId)) {
      return { success: false, error: 'No puedes enviarte una solicitud a ti mismo' };
    }

    try {
      const url = `${API_URL}/api/friends/request/${userId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Error al enviar la solicitud' };
        } catch (e) {
          return { success: false, error: 'Error de formato en la respuesta' };
        }
      }

      const data = await response.json();

      // Si todo va bien, llamamos al callback si existe
      if (options.onRequestSent && typeof options.onRequestSent === 'function') {
        options.onRequestSent(userId);
      }

      // También actualizamos la lista de amigos si es necesario
      if (options.refreshCallback && typeof options.refreshCallback === 'function') {
        options.refreshCallback();
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Acepta una solicitud de amistad

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
      return {
        success: false,
        error: err.message || 'Error al aceptar la solicitud'
      };
    }
  };

  // Elimina una amistad existente - solo muestra modal de confirmación
  const removeFriend = useCallback((friendshipId) => {
    if (!token || !friendshipId) {
      toast.error('ID de amistad no válido');
      return { success: false, error: 'ID de amistad no válido' };
    }

    // Guardamos el ID para usar en la confirmación
    setRemoveFriendId(friendshipId);
    setShowRemoveConfirmation(true);
    return { success: true };
  }, [token, toast]);

  // Confirma y ejecuta la eliminación de la amistad
  const confirmRemoveFriend = useCallback(async () => {
    if (!removeFriendId) {
      setShowRemoveConfirmation(false);
      return { success: false, error: 'ID de amistad no válido' };
    }

    try {
      const response = await fetch(`${API_URL}/api/friends/${removeFriendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la amistad');
      }

      // Actualizar lista de amigos
      await fetchFriends();

      // Ejecutar callback general si existe
      if (refreshCallback) {
        refreshCallback();
      }

      setShowRemoveConfirmation(false);
      setRemoveFriendId(null);
      toast.success('Amistad eliminada correctamente');

      return { success: true };
    } catch (err) {
      setShowRemoveConfirmation(false);
      setRemoveFriendId(null);
      toast.error('Error al eliminar la amistad');
      return {
        success: false,
        error: err.message || 'Error al eliminar la amistad'
      };
    }
  }, [token, removeFriendId, fetchFriends, refreshCallback, toast]);


  // Verifica el estado de amistad con un usuario
  const checkFriendshipStatus = async (userId) => {
    if (!token || !userId) {
      return { status: 'none' };
    }

    try {
      const response = await fetch(`${API_URL}/api/friends/check/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener el estado de amistad');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { status: 'none' };
    }
  };


  // Busca el ID de amistad en la lista de amigos
  const findFriendshipId = (userId) => {
    if (!friends || !friends.length) return null;

    const parsedUserId = parseInt(userId);

    for (const friend of friends) {
      if (
        (friend.user_id === parsedUserId || friend.id === parsedUserId) &&
        friend.friendship_id
      ) {
        return friend.friendship_id;
      }
    }

    return null;
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
    acceptFriendRequest,
    removeFriend,
    confirmRemoveFriend,
    showRemoveConfirmation,
    setShowRemoveConfirmation,
    checkFriendshipStatus,
    findFriendshipId
  };
};