import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Hook personalizado para gestionar notificaciones en la aplicación
 * @returns {Object} Estado y funciones relacionadas con notificaciones
 */
export const useNotifications = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    friendRequests: 0,
    invitationsPending: 0,
    hasNotifications: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Función para obtener las estadísticas de notificaciones del usuario
   */
  const fetchNotifications = useCallback(async () => {
  // No hacer nada si no hay token
  if (!token) {
    const emptyStats = {
      friendRequests: 0,
      invitationsPending: 0,
      hasNotifications: false
    };
    setStats(emptyStats);
    return emptyStats;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_URL}/api/user/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar las notificaciones');
    }

    const data = await response.json();

    // Asegurarnos de que los valores son números
    const friendRequests = parseInt(data.friendRequests) || 0;
    const invitationsPending = parseInt(data.invitationsPending) || 0;
    
    // Calcular si hay alguna notificación pendiente
    const hasNotifications = friendRequests > 0 || invitationsPending > 0;

    const updatedStats = {
      friendRequests,
      invitationsPending,
      hasNotifications
    };

    setStats(updatedStats);
    return updatedStats; // Devolver los datos actualizados
  } catch (err) {
    setError(err.message);
    console.error("Error fetching notifications:", err);
    // Usamos datos de demostración en caso de error
    const demoStats = {
      friendRequests: 2,
      invitationsPending: 3,
      hasNotifications: true
    };
    setStats(demoStats);
    return demoStats; // Devolver los datos de demostración
  } finally {
    setLoading(false);
  }
}, [token]);

  // Cargar notificaciones al inicializar el hook y cuando cambie el token
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Configurar un intervalo para actualizar las notificaciones periódicamente
  useEffect(() => {
    if (token) {
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 30000); // Actualizar cada 30 segundos

      return () => clearInterval(intervalId);
    }
  }, [token, fetchNotifications]);

  return {
    stats,
    hasNotifications: stats.hasNotifications,
    loading,
    error,
    refreshNotifications: fetchNotifications
  };
};