/**
 * Componente para invitar usuarios a un evento
 * 
 * Este componente permite:
 * - Buscar usuarios registrados en la plataforma
 * - Invitar usuarios por email (sean registrados o no)
 * - Proporcionar feedback visual del estado de la invitación
 * - Validar datos antes de enviar la invitación
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import useUserSearch from '../hooks/useUserSearch';
import { Avatar } from '../utils/Imagehelper';
import { useToast } from '../hooks/useToast';

const API_URL = import.meta.env.VITE_API_URL;

function InviteUsers({ eventId, onInvitationSent }) {
  const { token } = useAuth();
  const { success, error } = useToast();
  const [selectedUser, setSelectedUser] = useState(null);

  const [status, setStatus] = useState({
    loading: false
  });

  // Hook useUserSearch para gestionar la búsqueda de usuarios
  const { searchTerm, searchResults, isSearching, handleSearchTermChange, resetSearch, setSearchTerm } = useUserSearch({
      endpoint: '/api/tools/users/search',
      paramName: 'query',
      minLength: 2,
      debounceTime: 100
    });

  //Valida si una cadena tiene formato de email válido 
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Establece un usuario de los resultados de búsqueda como seleccionado
   * y muestra su email en el campo de entrada
   */
  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.email);
  };

  /**
   * Limpia la selección actual de usuario y el campo de búsqueda/email
   * permitiendo al usuario iniciar una nueva búsqueda o escribir otro email
   */
  const removeSelectedUser = () => {
    setSelectedUser(null);
    setSearchTerm('');
  };

  /**
   * Maneja los cambios en el campo de búsqueda/email
   * Actualiza el término de búsqueda y gestiona el estado del usuario seleccionado
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    handleSearchTermChange(value);

    // Si el usuario modifica el texto cuando ya había seleccionado un usuario,
    // se considera que ya no está utilizando ese usuario
    if (selectedUser && value !== selectedUser.email) {
      setSelectedUser(null);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    const isEmail = isValidEmail(searchTerm.trim());
    if (!isEmail) {
      error('Por favor, introduce un email válido');
      return;
    }

    setStatus({ loading: true });

    try {

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el servidor');
      }

      const data = await response.json();

      const isRegisteredUser = Boolean(data.userExists);
      let successMessage = isRegisteredUser
        ? '¡Invitación enviada al usuario registrado!'
        : '¡Se ha enviado un email de invitación al usuario no registrado!';

      success(successMessage);

      setSearchTerm('');
      setSelectedUser(null);
      if (onInvitationSent) onInvitationSent();

    } catch (err) {
      error(err.message || 'Error de conexión');
    } finally {
      setStatus({ loading: false });
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo unificado de búsqueda/email - Permite tanto buscar por nombre o email */}
        <section className="relative">
          <label htmlFor="search-email" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar usuario o introducir email
          </label>
          <article className="relative">
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
            {/* Indicador visual de búsqueda en curso */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Spinner size="xs" color="indigo" />
              </div>
            )}

            {/* Indicador visual de email válido - Proporciona feedback inmediato al usuario */}
            {!isSearching && searchTerm && isValidEmail(searchTerm) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </article>
          {/* Texto de ayuda contextual - Guía al usuario según el estado actual del campo */}
          {searchTerm && !isSearching && (
            <p className="mt-1 text-xs text-gray-500">
              {isValidEmail(searchTerm)
                ? selectedUser
                  ? "Usuario registrado seleccionado."
                  : "Email válido. Si no es un usuario registrado, se enviará una invitación por email."
                : "Continúa escribiendo para buscar usuarios o introduce un email válido."}
            </p>
          )}
          {/* Visualización del usuario seleccionado - Permite confirmar la selección y editarla */}
          {selectedUser && (
            <aside className="mt-2 bg-indigo-50 p-2 rounded-md flex items-center">
              <Avatar
                user={selectedUser}
                size="sm"
                className="mr-3"
              />
              <header className="flex-1">
                <p className="text-sm font-medium">{selectedUser.username || "Usuario"}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </header>
              <button
                type="button"
                onClick={removeSelectedUser}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" />                
                </svg>
              </button>
            </aside>
          )}
        </section>
        {/* Resultados de búsqueda */}
        {!selectedUser && searchResults.length > 0 && (
          <section className="mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">            
          {searchResults.map(user => (
            <article
              key={user.id}
              onClick={() => selectUser(user)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <Avatar
                user={user}
                size="sm"
                className="mr-3"
              />
              <header>
                <p className="text-sm font-medium">{user.username || "Usuario"}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </header>
            </article>
          ))}
          </section>
        )}
        {/* Botón de envío de invitación */}
        <nav>
          <button
            type="submit"
            disabled={status.loading || !searchTerm.trim() || !isValidEmail(searchTerm.trim())}
            className={`w-full px-4 py-2 rounded-md text-white font-medium ${status.loading || !searchTerm.trim() || !isValidEmail(searchTerm.trim())
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:from-fuchsia-600 hover:to-indigo-600'
              }`}
          >
            {status.loading ? (
              <span className="flex items-center justify-center">
                <Spinner size="xs" color="white" containerClassName="mr-2" />
                <span>Enviando...</span>
              </span>
            ) : (
              'Enviar invitación'
            )}
          </button>
        </nav>
      </form>
    </div>
  );
}

export default InviteUsers;