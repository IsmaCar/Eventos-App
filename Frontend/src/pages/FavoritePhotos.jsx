/**
 * Página FavoritePhotos - Gestiona la visualización de fotos favoritas del usuario
 * Permite ver, descargar y eliminar fotos de la colección de favoritos
 * Incluye vista ampliada y navegación entre eventos
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePhotoUploads } from '../hooks/usePhotoUploads';
import { useToast } from '../hooks/useToast';
import { getImageUrl } from '../utils/Imagehelper';
import Spinner from '../components/Spinner';

const API_URL = import.meta.env.VITE_API_URL;


function FavoritePhotos() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Utilizamos el hook usePhotoUploads con todas las funcionalidades
  const { expandedPhoto, openExpandedView, closeExpandedView, handleDownloadPhoto } = usePhotoUploads(null, false, null, navigate);
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchFavoritePhotos();
  }, [token, navigate]);


  const fetchFavoritePhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/user/favorite-photos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las fotos favoritas');
      }
      
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      setError('No se pudieron cargar tus fotos favoritas');
      toast.error('Error al cargar fotos favoritas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Elimina una foto de la lista de favoritos del usuario
   * Actualiza la UI inmediatamente y cierra vista ampliada si es necesario
   */
  const removeFavorite = async (photoId, e) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_URL}/api/photos/${photoId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Actualizar lista de favoritos
        setPhotos(photos.filter(photo => photo.id !== photoId));
        
        // Si estamos viendo la foto ampliada, cerrarla
        if (expandedPhoto && expandedPhoto.id === photoId) {
          closeExpandedView();
        }
        
        toast.success('Foto eliminada de favoritos');
      } else {
        throw new Error('Error al eliminar de favoritos');
      }
    } catch (error) {
      toast.error('Error al eliminar de favoritos: ' + error.message);
    }
  };

  if (loading) {
    return <Spinner containerClassName="h-64" color="fuchsia" text="Cargando fotos favoritas..." />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis fotos favoritas</h1>
        <p className="text-gray-600">Colección de tus fotos favoritas de diferentes eventos</p>
      </header>
      
      {error ? (
        <section className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-6">
          {error}
        </section>
      ) : photos.length > 0 ? (        
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <article 
              key={photo.id} 
              className="relative group overflow-hidden rounded-lg shadow-md aspect-square cursor-pointer"
              onClick={() => openExpandedView(photo)}
            >              
              <figure className="w-full h-full">
                <img
                  src={getImageUrl(`/uploads/event_photos/${photo.filename}`)}
                  alt={`Foto de evento`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </figure>
              <aside className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <nav className="flex justify-between items-center">
                  <Link 
                    to={`/events/${photo.event.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-white text-sm font-medium hover:text-indigo-200"
                  >
                    {photo.event.title}
                  </Link>
                  
                  <span className="flex space-x-2">
                    {/* Botón para descargar la foto */}
                    <button
                      onClick={(e) => handleDownloadPhoto(photo, photo.event?.title, e)}
                      className="text-white hover:text-blue-300 transition-colors"
                      title="Descargar foto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>                  
                    {/* Botón para eliminar de favoritos */}
                    <button 
                      onClick={(e) => removeFavorite(photo.id, e)}
                      className="text-white hover:text-pink-400 transition-colors"
                      title="Quitar de favoritos"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                </nav>
                {/* Se ha eliminado la línea con la fecha */}
              </aside>
            </article>
          ))}
        </section>      
        ) : (
        <section className="text-center p-10 bg-gray-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 mb-1">No tienes fotos favoritas aún</h2>
          <p className="text-gray-500 mb-4">Explora eventos y marca fotos como favoritas para verlas aquí</p>
          <Link to="/" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition">
            Explorar eventos
          </Link>
        </section>
      )}   
      {/* Vista ampliada - utilizando el estado del hook */}
      {expandedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeExpandedView}
        >
          <article className="relative max-w-5xl max-h-[90vh] w-full">
            <section 
              className="relative overflow-hidden rounded-lg"
              onClick={e => e.stopPropagation()}
            >              <figure className="w-full h-auto max-h-[85vh] object-contain bg-black">
                <img
                  src={getImageUrl(`/uploads/event_photos/${expandedPhoto.filename}`)}
                  alt="Foto favorita"
                  className="w-full h-auto max-h-[85vh] object-contain bg-black"
                />
              </figure>
              
              <footer className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                <div className="flex justify-between items-center">
                  <aside>
                    <Link 
                      to={`/events/${expandedPhoto.event.id}`}
                      onClick={(e) => {e.stopPropagation(); closeExpandedView();}}
                      className="font-medium hover:text-indigo-200"
                    >
                      {expandedPhoto.event.title}
                    </Link>
                    <p className="text-sm text-gray-200">
                      {expandedPhoto.user?.username || "Usuario"}
                      {/* Se ha eliminado la fecha */}
                    </p>
                  </aside>
                  
                  <nav className="flex items-center space-x-4">
                    {/* Botón para descargar foto en vista ampliada */}
                    <button
                      onClick={(e) => handleDownloadPhoto(expandedPhoto, expandedPhoto.event?.title, e)}
                      className="text-white hover:text-blue-300 transition-colors p-2"
                      title="Descargar foto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    
                    {/* Botón para quitar de favoritos en vista ampliada */}
                    <button 
                      onClick={(e) => removeFavorite(expandedPhoto.id, e)}
                      className="text-white hover:text-pink-400 transition-colors p-2"
                      title="Quitar de favoritos"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </footer>
            </section>
          </article>
        </div>
      )}
    </div>
  );
}

export default FavoritePhotos;