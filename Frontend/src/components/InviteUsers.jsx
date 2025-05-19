import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import useUserSearch from '../hooks/useUserSearch';

const API_URL = import.meta.env.VITE_API_URL;

function InviteUsers({ eventId, onInvitationSent }) {
  const { token } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [status, setStatus] = useState({ 
    loading: false, 
    error: null, 
    success: false,
    message: '' 
  });

  // Utilizar el hook useUserSearch con configuración específica para este componente
  const {
    searchTerm,
    searchResults,
    isSearching,
    handleSearchTermChange,
    resetSearch,
    setSearchTerm
  } = useUserSearch({
    endpoint: '/tools/users/search',
    paramName: 'query',
    minLength: 2,
    debounceTime: 100
  });

  // Validador de formato de email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Función para seleccionar un usuario del resultado de búsqueda
  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.email); // Mostramos el email del usuario seleccionado en el campo
  };

  // Función para quitar la selección del usuario
  const removeSelectedUser = () => {
    setSelectedUser(null);
    setSearchTerm(''); // Limpiamos el campo para buscar otro usuario
  };

  // Función para manejar cambios en el campo de búsqueda/email
  const handleInputChange = (e) => {
    const value = e.target.value;
    handleSearchTermChange(value);
    
    // Si hay un usuario seleccionado y se cambia el texto, desvinculamos al usuario
    if (selectedUser && value !== selectedUser.email) {
      setSelectedUser(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;
    
    // Si es un email válido, podemos continuar
    const isEmail = isValidEmail(searchTerm.trim());
    if (!isEmail) {
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
      // Incluir el ID del usuario si está seleccionado
      const payload = { 
        email: searchTerm.trim(),
        user_id: selectedUser?.id || null
      };

      const response = await fetch(`${API_URL}/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Si hay un error del servidor, manejarlo aquí
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el servidor');
      }

      const data = await response.json();
      
      // Determinar si el usuario existe de forma más robusta
      const isRegisteredUser = Boolean(data.userExists);
      
      // Mensaje basado en si el usuario está registrado o no
      let successMessage = isRegisteredUser
        ? '¡Invitación enviada al usuario registrado!'
        : '¡Se ha enviado un email de invitación al usuario no registrado!';
        
      setStatus({ 
        loading: false, 
        error: null, 
        success: true,
        message: successMessage
      });
      
      // Limpiar campos y notificar
      setSearchTerm('');
      setSelectedUser(null);
      if (onInvitationSent) onInvitationSent();
      
    } catch (error) {
      console.error('Error al enviar invitación:', error);
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
        {/* Campo unificado de búsqueda/email */}
        <div className="relative">
          <label htmlFor="search-email" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar usuario o introducir email
          </label>
          <div className="relative">
            <input
              id="search-email"
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Busca por nombre de usuario o introduce un email"
              className={`w-full px-3 py-2 border 
                ${searchTerm && !isValidEmail(searchTerm) && !isSearching ? 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500' : ''}
                ${searchTerm && isValidEmail(searchTerm) ? 'border-green-300 focus:ring-green-500 focus:border-green-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} 
                rounded-md shadow-sm focus:outline-none`}
              disabled={status.loading}
            />
            
            {/* Indicador de búsqueda */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Spinner size="xs" color="indigo" />
              </div>
            )}
            
            {/* Icono indicador de email válido */}
            {!isSearching && searchTerm && isValidEmail(searchTerm) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Texto de ayuda contextual */}
          {searchTerm && !isSearching && (
            <p className="mt-1 text-xs text-gray-500">
              {isValidEmail(searchTerm) 
                ? selectedUser 
                  ? "Usuario registrado seleccionado." 
                  : "Email válido. Si no es un usuario registrado, se enviará una invitación por email." 
                : "Continúa escribiendo para buscar usuarios o introduce un email válido."}
            </p>
          )}
          
          {/* Visualización del usuario seleccionado */}
          {selectedUser && (
            <div className="mt-2 bg-indigo-50 p-2 rounded-md flex items-center">
              {selectedUser.avatar ? (
                <img
                  src={`${API_URL}/uploads/avatars/${selectedUser.avatar}`}
                  alt={selectedUser.username}
                  className="w-8 h-8 rounded-full mr-3"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mr-3">
                  {selectedUser.username?.charAt(0).toUpperCase() || selectedUser.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedUser.username || "Usuario"}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={removeSelectedUser}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {!selectedUser && searchResults.length > 0 && (
          <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
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

        <div>
          <button
            type="submit"
            disabled={status.loading || !searchTerm.trim() || !isValidEmail(searchTerm.trim())}
            className={`w-full px-4 py-2 rounded-md text-white font-medium ${
              status.loading || !searchTerm.trim() || !isValidEmail(searchTerm.trim())
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600'
            }`}
          >
            {status.loading ? (
              <div className="flex items-center justify-center">
                <Spinner size="xs" color="white" containerClassName="mr-2" />
                <span>Enviando...</span>
              </div>
            ) : (
              'Enviar invitación'
            )}
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