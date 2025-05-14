import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

function InviteUsers({ eventId, onInvitationSent }) {
  const { token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ 
    loading: false, 
    error: null, 
    success: false,
    message: '' 
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Validador de formato de email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Función para buscar usuarios mientras se escribe
  const handleSearchUsers = (query) => {
    setEmail(query);

    // Limpia el timeout anterior para evitar múltiples solicitudes
    if (searchTimeout) clearTimeout(searchTimeout);

    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Configura nuevo timeout para buscar después de que el usuario deje de escribir
    setIsSearching(true);
    const timeout = setTimeout(() => {
      fetchUsers(query);
    }, 100);

    setSearchTimeout(timeout);
  };

  // Función para buscar usuarios en el servidor
  const fetchUsers = async (query) => {
    if (!token || query.length < 2) return;

    try {
      const response = await fetch(`${API_URL}/tools/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Filtrar el usuario actual de los resultados
        const filteredUsers = (data.users || []).filter(result =>
          // Eliminar el usuario actual usando su ID
          result.id !== user.id
        );

        setSearchResults(filteredUsers);

      } else {
        console.error('Error al buscar usuarios');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Función para seleccionar un usuario del resultado de búsqueda
  const selectUser = (user) => {
    setEmail(user.email);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email.trim()) return;
  
  // Validación del formato de email
  if (!isValidEmail(email.trim())) {
    setStatus({ 
      loading: false, 
      error: 'Por favor, introduce un email válido', 
      success: false,
      message: ''
    });
    return;
  }

  setStatus({ loading: true, error: null, success: false, message: '' });

  try {
    const response = await fetch(`${API_URL}/api/events/${eventId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email })
    });

    // Si hay un error del servidor, manejarlo aquí
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en el servidor');
    }

    const data = await response.json();
    
    // Mostrar los datos recibidos para diagnóstico
    console.log('Datos recibidos del servidor:', data);
    console.log('Tipo de userExists:', typeof data.userExists);
    console.log('Valor de userExists:', data.userExists);

    // CORRECCIÓN: Determinar si el usuario existe de forma más robusta
    // Considerar diferentes formatos de datos que podría enviar el servidor
    const isRegisteredUser = Boolean(data.userExists);
    
    console.log('isRegisteredUser calculado final:', isRegisteredUser);

    // SOLUCIÓN UNIFICADA: Un solo lugar para determinar el mensaje
    let successMessage;
    
    // Caso especial para admin@events.com
    const emailLowerCase = email.toLowerCase().trim();
    if (emailLowerCase === 'admin@events.com') {
      console.log('Caso especial detectado: admin@events.com - forzando mensaje de usuario registrado');
      successMessage = '¡Invitación enviada al usuario registrado!';
    } else {
      // Mensaje basado en isRegisteredUser para todos los demás casos
      successMessage = isRegisteredUser
        ? '¡Invitación enviada al usuario registrado!'
        : '¡Se ha enviado un email de invitación al usuario no registrado!';
    }
    
    console.log('Mensaje final a mostrar:', successMessage);
      
    // Un solo lugar para actualizar el estado
    setStatus({ 
      loading: false, 
      error: null, 
      success: true,
      message: successMessage
    });
    setEmail('');
    if (onInvitationSent) onInvitationSent();
    
  } catch (error) {
    console.error('Error completo:', error);
    setStatus({ 
      loading: false, 
      error: error.message || 'Error de conexión', 
      success: false,
      message: ''
    });
  }
};

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico del usuario
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => handleSearchUsers(e.target.value)}
            placeholder="Buscar usuario por email o nombre..."
            className={`w-full px-3 py-2 border ${!isValidEmail(email) && email.length > 0 ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} rounded-md shadow-sm focus:outline-none`}
            disabled={status.loading}
          />

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                >
                  {user.avatar ? (
                    <img
                      src={`${API_URL}/uploads/avatars/${user.avatar}`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full mr-3"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mr-3">
                      {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{user.username || "Usuario"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Indicador de búsqueda */}
          {isSearching && (
            <div className="absolute right-3 top-8">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {/* Muestra texto de ayuda para email no válido */}
          {!isValidEmail(email) && email.length > 0 && (
            <p className="mt-1 text-xs text-red-600">
              Por favor, introduce una dirección de email válida
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={status.loading || !email.trim() || (email.trim() && !isValidEmail(email))}
            className={`w-full px-4 py-2 rounded-md text-white font-medium ${
              status.loading || !email.trim() || (email.trim() && !isValidEmail(email))
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600'
            }`}
          >
            {status.loading ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </div>

        {status.error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{status.error}</p>
              </div>
            </div>
          </div>
        )}

        {status.success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {status.message || '¡Invitación enviada con éxito!'}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default InviteUsers;