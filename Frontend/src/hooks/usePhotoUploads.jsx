/**
 * Hook para gestionar la carga, descarga y gestión de fotos de eventos
 * Se encarga de:
 * - Subir nuevas fotos (con validación)
 * - Descargar fotos
 * - Eliminar fotos (con verificación de permisos)
 * - Gestionar vistas expandidas
 * - Manejar alertas y redirecciones relacionadas
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export function usePhotoUploads(eventId, isEventCreator, refreshPhotosList, navigate) {
  const { user, token } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  // Constantes de validación
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];


  // Valida un archivo antes de su carga

  const validateFile = (file) => {
    setUploadError(null);

    if (!file) {
      setUploadError('No se ha seleccionado ningún archivo');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('El formato del archivo no es válido. Por favor, sube una imagen (JPG, PNG o WEBP)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('El archivo es demasiado grande. El tamaño máximo es de 8MB');
      return false;
    }

    return true;
  };


  // Maneja el cambio de archivo seleccionado

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError(null);

    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    } else {
      setSelectedFile(null);
    }
  };


  // Sube una foto al evento

  const uploadPhoto = async () => {
    if (!selectedFile || !token || !eventId) {
      return { success: false, error: 'No hay archivo seleccionado o no estás autenticado' };
    }

    // Validación adicional antes de subir
    if (!validateFile(selectedFile)) {
      return { success: false, error: uploadError };
    }

    try {
      setUploading(true);
      setUploadError(null);

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

      // Refrescar la lista de fotos
      if (refreshPhotosList) {
        await refreshPhotosList();
      }

      return { success: true };
    } catch (error) {
      console.error('Error al subir foto:', error);
      setUploadError(error.message);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
    }
  };


  // Maneja el proceso completo de subida con alertas y redirecciones
  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    if (!token) {
      if (navigate) {
        navigate('/login', { state: { from: `/events/${eventId}` } });
      }
      return;
    }

    const result = await uploadPhoto();

    if (result.success) {
      alert('Foto subida correctamente');
    } else {
      alert(`Error al subir la foto: ${result.error}`);
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


  // Elimina una foto

  const deletePhoto = async (photoId, photos, e) => {
    if (e) e.stopPropagation();
    if (!token) return { success: false, error: 'No autenticado' };

    const photoToDelete = photos.find(photo => photo.id === photoId);
    if (!photoToDelete) return { success: false, error: 'Foto no encontrada' };

    if (!canDeletePhoto(photoToDelete)) {
      return { success: false, error: 'No tienes permiso para eliminar esta foto' };
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

      // Si la foto expandida es la que estamos eliminando, cerrar el modal
      if (expandedPhoto && expandedPhoto.id === photoId) {
        closeExpandedView();
      }

      // Refrescar la lista de fotos
      if (refreshPhotosList) {
        await refreshPhotosList();
      }

      return { success: true };
    } catch (error) {
      console.error("Error eliminando foto:", error);
      return { success: false, error: error.message };
    } finally {
      setDeletingPhotoId(null);
    }
  };


  // Descarga una foto 
  const downloadPhoto = async (photo, eventTitle, e) => {
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

      return { success: true };
    } catch (error) {
      console.error("Error descargando foto:", error);
      return { success: false, error: error.message };
    }
  };


  // Maneja el proceso completo de descarga con alertas

  const handleDownloadPhoto = async (photo, eventTitle, e) => {
    const result = await downloadPhoto(photo, eventTitle, e);

    if (!result.success) {
      alert(`Error al descargar la foto: ${result.error}`);
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
    setUploadError(null);
  };

  return {
    // Estado de archivos
    selectedFile,
    uploadError,
    uploading,

    // Acciones de archivos
    handleFileChange,
    uploadPhoto,
    handleUploadPhoto,  // Nuevo método con alertas
    clearSelectedFile,

    // Eliminación
    deletingPhotoId,
    canDeletePhoto,
    deletePhoto,

    // Descarga
    downloadPhoto,
    handleDownloadPhoto, // Nuevo método con alertas

    // Vista expandida
    expandedPhoto,
    openExpandedView,
    closeExpandedView,

    // Constantes para interfaz de usuario
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
    allowedTypesFormatted: 'JPG, PNG, WEBP'
  };
}