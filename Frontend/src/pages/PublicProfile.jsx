import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL;

function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

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
            'Content-Type': 'application/json'
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
        
        setLoading(false);
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setError(`No se pudo cargar el perfil: ${err.message}`);
        setLoading(false);
      }
    }
    
    loadProfileData();
  }, [id, API_URL]);

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

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Cabecera del perfil */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8">
          <div className="flex flex-col md:flex-row items-center">
            {profile.avatar ? (
              <img 
                src={`${API_URL}${profile.avatar}`} 
                alt={profile.username} 
                className="w-24 h-24 rounded-full bg-white border-4 border-white object-cover mb-4 md:mb-0 md:mr-6"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white text-indigo-600 flex items-center justify-center text-3xl font-bold mb-4 md:mb-0 md:mr-6 border-4 border-white">
                {profile.username ? profile.username.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
              <p className="text-indigo-100 mt-2">Usuario desde {new Date(profile.createdAt).toLocaleDateString('es-ES', {year: 'numeric', month: 'long'})}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección de eventos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Eventos creados</h2>
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
                      style={{ backgroundImage: `url(${API_URL}${event.image})` }}
                    ></div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-400 text-xl">📷</span>
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
                      <span className="truncate">{event.location.address}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicProfile;