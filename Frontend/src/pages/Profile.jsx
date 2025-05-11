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
    eventsAttended: 0,
  });

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
        eventsAttended: data.eventsAttended || 0
      });
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err);
      // Establecer valores por defecto si hay error
      setStats({
        eventsCreated: user.eventsCreated || 0,
        eventsAttended: user.eventsAttended || 0
      });
    }
  };

  useEffect(() => {
    !token ? navigate('/login') : null;
    if (user && token) {
      fetchUserStats();
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
            {/* Contenedor para el componente anidado */}
            <div>
              <Outlet />
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
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
                <p className="text-2xl font-bold text-fuchsia-600">{stats.eventsAttended || 0}</p>
                <p className="text-gray-500 text-sm">Eventos asistidos</p>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-fuchsia-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Contacto
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <p className="text-gray-700">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
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
                className="block w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Editar perfil
              </Link>
              <Link
                to="/create-event"
                className="block w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Crear nuevo evento
              </Link>
              <Link
                to="my-events"
                className="block w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Mis eventos
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* El Outlet está dentro de la tarjeta de acciones rápidas */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}

export default Profile;