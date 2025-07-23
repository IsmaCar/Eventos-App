/**
 * Componente para gestionar las solicitudes de amistad recibidas
 * Este componente permite al usuario:
 * - Visualizar todas las solicitudes de amistad pendientes
 * - Aceptar o rechazar solicitudes individuales
 * - Ver información básica del remitente de cada solicitud
 * 
 * Utiliza el hook personalizado useFriends para la gestión de aceptación
 * y mantiene sincronizado el estado local con las acciones del usuario
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import { useFriends } from '../hooks/useFriends';
import { formatShortDate } from '../utils/DateHelper';
import { Avatar } from '../utils/Imagehelper';
import { useToast } from '../hooks/useToast';
const API_URL = import.meta.env.VITE_API_URL;

function FriendRequests({ onRequestProcessed }) {

  const { token } = useAuth();
  const { success, error } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hook useFriends
  const {
    acceptFriendRequest: hookAcceptRequest,
    loading: friendsLoading,
    error: friendsError
  } = useFriends({
    acceptEndpoint: '/api/friends/accept',
    refreshCallback: onRequestProcessed,
    onRequestAccepted: (requestId) => {
      // Actualiza el estado local eliminando la solicitud aceptada
      setRequests(prevRequests =>
        prevRequests.filter(request => request.id !== requestId)
      );
    }
  });


  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/friends/requests/received`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las solicitudes de amistad');
      } const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      error("Error al cargar las solicitudes");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  //Acepta una solicitud de amistad utilizando el hook personalizado
  const handleAcceptFriendRequest = async (requestId) => {
    const result = await hookAcceptRequest(requestId);
    if (!result.success) {
      error(result.error || 'No se pudo aceptar la solicitud de amistad');
    } else {
      success('Solicitud de amistad aceptada');
    }
  };


  // Rechaza una solicitud de amistad mediante petición al servidor
  const handleRejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al rechazar la solicitud');
      }
      // Actualiza la lista de solicitudes eliminando la rechazada
      setRequests(prevRequests =>
        prevRequests.filter(request => request.id !== requestId)
      );

      toast.success('Solicitud de amistad rechazada');

      // Notifica al componente padre sobre el cambio
      if (typeof onRequestProcessed === 'function') {
        onRequestProcessed();
      }
    } catch (err) {
      error('No se pudo rechazar la solicitud de amistad');
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriendRequests();
    }
  }, [token]);

  // Combina estados de carga del componente y del hook
  const isLoading = loading || friendsLoading;
  return (
    <div className="bg-white rounded-xl p-4">
      {isLoading ? (
        <Spinner size="md" color="fuchsia" containerClassName="py-10" text="Cargando solicitudes..." />
      ) :
        /* Listado de solicitudes - Si hay solicitudes pendientes */
        requests.length > 0 ? (<section className="space-y-4">
          {requests.map(request => (
            <article key={request.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              {/* Sección de información del usuario que envía la solicitud */}
              <aside className="flex items-center">
                <Avatar
                  user={request.requester || { username: 'Usuario desconocido' }}
                  size="md"
                  className="flex-shrink-0"
                />
                <header className="ml-4">
                  <p className="text-gray-800 font-medium">
                    {request.requester?.username || 'Usuario desconocido'}
                  </p>
                  <time className="text-gray-500 text-sm">{formatShortDate(request.created_at)}</time>
                </header>
              </aside>
              <nav className="flex space-x-2">
                <button
                  onClick={() => handleAcceptFriendRequest(request.id)}
                  className="px-4 py-2 bg-fuchsia-600 text-white text-sm rounded-md hover:bg-fuchsia-700 transition-colors"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleRejectFriendRequest(request.id)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                >
                  Rechazar
                </button>
              </nav>
            </article>
          ))}
        </section>
        ) : (
          <aside className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">No tienes solicitudes de amistad pendientes</p>
          </aside>
        )}
    </div>
  );
}

export default FriendRequests;