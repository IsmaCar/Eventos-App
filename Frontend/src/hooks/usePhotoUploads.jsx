/**
 * Hook para gestionar la carga, descarga y gestión de fotos de eventos
 * Se encarga de:
 * - Subir nuevas fotos (con validación)
 * - Descargar fotos
 * - Eliminar fotos (con verificación de permisos)
 * - Gestionar vistas expandidas
 * - Manejar notificaciones toast y redirecciones relacionadas
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './useToast';

const API_URL = import.meta.env.VITE_API_URL;

export function usePhotoUploads(eventId, isEventCreator, refreshPhotosList, navigate) {
  const { user, token } = useAuth();
  const { success, error } = useToast();
  
  // Estados necesarios
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);
  
  // Constantes de validación
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Valida un archivo antes de su carga
  const validateFile = (file) => {
    if (!file) {
      error('No se ha seleccionado ningún archivo');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      error('El formato del archivo no es válido. Por favor, sube una imagen (JPG, PNG o WEBP)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      error('El archivo es demasiado grande. El tamaño máximo es de 1MB');
      return false;
    }

    return true;
  };

  // Maneja el cambio de archivo seleccionado
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && validateFile(file)) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  // Sube una foto al evento (versión con toast integrado)
  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      error('Selecciona una foto primero');
      return;
    }

    if (!token) {
      error('Debes iniciar sesión para subir fotos');
      if (navigate) {
        navigate('/login', { state: { from: `/events/${eventId}` } });
      }
      return;
    }

    // Validación final antes de subir
    if (!validateFile(selectedFile)) return;

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch(`${API_URL}/api/events/${eventId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir la foto');
      }

      // Éxito - limpiar la selección de archivo
      setSelectedFile(null);
      success('Foto subida correctamente');

      // Refrescar la lista de fotos
      if (refreshPhotosList) {
        await refreshPhotosList();
      }

    } catch (err) {
      error(`Error al subir la foto: ${err.message}`);
    }
  };

  // Verifica si un usuario puede eliminar una foto
  const canDeletePhoto = useCallback((photo) => {
    if (!user || !token) return false;

    // El creador del evento puede eliminar cualquier foto
    if (isEventCreator) return true;

    // El propietario de la foto puede eliminar su propia foto
    return photo.user?.id === user.id;
  }, [user, token, isEventCreator]);

  // Elimina una foto (versión con toast integrado)
  const handleDeletePhoto = async (photoId, photos, e) => {
    if (e) e.stopPropagation();
    
    if (!token) {
      error('Debes iniciar sesión');
      return;
    }

    const photoToDelete = photos.find(photo => photo.id === photoId);
    if (!photoToDelete) {
      error('Foto no encontrada');
      return;
    }

    if (!canDeletePhoto(photoToDelete)) {
      error('No tienes permiso para eliminar esta foto');
      return;
    }

    try {
      setDeletingPhotoId(photoId);

      const response = await fetch(`${API_URL}/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar la foto');
      }

      success('Foto eliminada correctamente');

      // Si la foto expandida es la que estamos eliminando, cerrar el modal
      if (expandedPhoto?.id === photoId) {
        closeExpandedView();
      }

      // Refrescar la lista de fotos
      if (refreshPhotosList) {
        await refreshPhotosList();
      }

    } catch (err) {
      error(`Error al eliminar: ${err.message}`);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Descarga una foto (versión con toast integrado)
  const handleDownloadPhoto = async (photo, eventTitle, e) => {
    if (e) e.stopPropagation();

    try {
      const response = await fetch(`${API_URL}/api/photos/${photo.id}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('No se pudo descargar la foto');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `foto-evento-${eventTitle?.replace(/\s+/g, '-') || 'evento'}-${photo.id}.jpg`;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (err) {
      error(`Error al descargar: ${err.message}`);
    }
  };

  // Abre la vista expandida de una foto
  const openExpandedView = (photo) => {
    setExpandedPhoto(photo);
    document.body.style.overflow = 'hidden';
  };

  // Cierra la vista expandida
  const closeExpandedView = () => {
    setExpandedPhoto(null);
    document.body.style.overflow = 'auto';
  };

  // Limpia el archivo seleccionado
  const clearSelectedFile = () => {
    setSelectedFile(null);
  };

  return {
    selectedFile,
    handleFileChange,
    handleUploadPhoto,    // Solo versión con toast
    clearSelectedFile,
    deletingPhotoId,
    canDeletePhoto,
    handleDeletePhoto,    // Solo versión con toast
    handleDownloadPhoto,  // Solo versión con toast
    expandedPhoto,
    openExpandedView,
    closeExpandedView,
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
    allowedTypesFormatted: 'JPG, PNG, WEBP'
  };
}