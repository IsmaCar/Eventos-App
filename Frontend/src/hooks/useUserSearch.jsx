import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Hook personalizado para búsqueda de usuarios con parametrización
 * @param {Object} options - Opciones de configuración
 * @param {string} options.endpoint - Endpoint de la API para la búsqueda
 * @param {string} options.paramName - Nombre del parámetro de búsqueda
 * @param {number} options.minLength - Longitud mínima del término para iniciar búsqueda
 * @param {boolean} options.filterCurrentUser - Si se debe filtrar al usuario actual
 * @param {number} options.debounceTime - Tiempo de debounce en milisegundos
 * @param {Function} options.onResultsLoaded - Callback cuando se cargan resultados
 */
export const useUserSearch = (options = {}) => {
  const {
    endpoint = '/api/friends/search',
    paramName = 'term',
    minLength = 3,
    filterCurrentUser = true,
    debounceTime = 300,
    onResultsLoaded = null
  } = options;

  const { token, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Maneja el cambio en el término de búsqueda con debounce
   * @param {string} query - Término de búsqueda
   */
  const handleSearchTermChange = (query) => {
    setSearchTerm(query);
    setError(null);

    // Limpia el timeout anterior para evitar múltiples solicitudes
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!query || query.length < minLength) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Configura nuevo timeout para buscar después de que el usuario deje de escribir
    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchUsers(query);
    }, debounceTime);

    setSearchTimeout(timeout);
  };

  /**
   * Realiza la búsqueda de usuarios
   * @param {string} query - Término de búsqueda
   */
  const searchUsers = async (query) => {
    if (!token || !query || query.length < minLength) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `${API_URL}${endpoint}?${paramName}=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la búsqueda');
      }

      const data = await response.json();
      
      // Obtener la lista de usuarios del resultado (adaptable a diferentes formatos)
      let users = data.users || data.results || data;
      
      // Filtrar usuario actual si es necesario
      if (filterCurrentUser && user?.id) {
        users = users.filter(item => item.id !== user.id);
      }
      
      setSearchResults(users);
      setError(null);
      
      // Llamar al callback si existe
      if (onResultsLoaded) {
        onResultsLoaded(users);
      }
    } catch (error) {
      console.error('Error en la búsqueda de usuarios:', error);
      setSearchResults([]);
      setError(error.message || 'Error en la búsqueda');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Actualiza un usuario específico en los resultados de búsqueda
   * @param {string} userId - ID del usuario a actualizar
   * @param {Object} updates - Propiedades a actualizar
   */
  const updateUserInResults = (userId, updates) => {
    setSearchResults(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, ...updates }
          : user
      )
    );
  };

  /**
   * Limpia los resultados y el término de búsqueda
   */
  const resetSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
    setError(null);
    if (searchTimeout) clearTimeout(searchTimeout);
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  return {
    searchTerm,
    searchResults,
    isSearching,
    error,
    setSearchTerm,
    setSearchResults,
    handleSearchTermChange,
    searchUsers,
    updateUserInResults,
    resetSearch
  };
};

export default useUserSearch;