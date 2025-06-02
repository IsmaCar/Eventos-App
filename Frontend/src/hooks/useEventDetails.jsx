/**
 * Hook para cargar y gestionar la información básica de un evento
 * Se encarga de: 
 * - Cargar datos del evento
 * - Cargar fotos del evento
 * - Gestionar favoritos de fotos
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';

const API_URL = import.meta.env.VITE_API_URL;

export function useEventDetails(eventId) {
  const { getEventById, getImageUrl } = useEvent();
  const { token } = useAuth();
  
  // Estados para el evento
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para fotos
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoFavorites, setPhotoFavorites] = useState({});
  
  // Cargar datos del evento
  useEffect(() => {
    async function loadEventData() {
      if (!eventId) return;
      
      try {
        setLoading(true);
        const data = await getEventById(eventId);
        setEvent(data.event || data);
        setError(null);
      } catch (err) {
        console.error("Error cargando el evento:", err);
        setError("No se pudo cargar el evento");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadEventData();
  }, [eventId, getEventById]);

  // Cargar fotos del evento
  const fetchEventPhotos = useCallback(async () => {
    if (!eventId) return;
    
    try {
      setLoadingPhotos(true);
      const response = await fetch(`${API_URL}/api/events/${eventId}/photos`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las fotos');
      }
      
      const data = await response.json();
      const photosArray = data.photos || [];
      setPhotos(photosArray);
      
      // Si hay token y fotos, cargar estado de favoritos
      if (token && photosArray.length > 0) {
        fetchFavoritesStatus(photosArray);
      }
    } catch (error) {
      console.error('Error al cargar las fotos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  }, [eventId, token]);

  // Cargar estado de favoritos
  const fetchFavoritesStatus = async (photosArray) => {
    if (!token || !photosArray?.length) return;
    
    try {
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

  // Marcar/desmarcar favorito
  const toggleFavorite = async (photoId, e) => {
    if (e) e.stopPropagation();
    if (!token) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/photos/${photoId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotoFavorites(prev => ({
          ...prev,
          [photoId]: data.isFavorite
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
      return false;
    }
  };

  // Cargar fotos cuando tengamos el evento cargado
  useEffect(() => {
    if (event) {
      fetchEventPhotos();
    }
  }, [event, fetchEventPhotos]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";

    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (error) {
      return dateString;
    }
  };

  return {
    event,
    loading,
    error,
    getImageUrl,
    photos,
    loadingPhotos,
    photoFavorites,
    toggleFavorite,
    formatDate,
    fetchEventPhotos
  };
}