import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

function Invitations() {
  const { token } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/invitations/user/received`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar invitaciones');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
      setError(null);
    } catch (err) {
      console.error('Error obteniendo invitaciones:', err);
      setError(err.message);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventInvitation = async (invitationId, status) => {
    try {
      // Actualizar UI para mostrar que está procesando
      setInvitations(prevInvitations => 
        prevInvitations.map(inv => 
          inv.id === invitationId 
            ? {...inv, processing: true} 
            : inv
        )
      );
      
      // Convertir los valores 'accepted'/'declined' a 'accept'/'reject'
      const responseValue = status === 'accepted' ? 'accept' : 'reject';
      
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          response: responseValue 
        })
      });

      if (!response.ok) {
        throw new Error(`Error al ${status === 'accepted' ? 'aceptar' : 'rechazar'} la invitación`);
      }

      // Eliminar la invitación respondida de la lista
      setInvitations(prevInvitations => 
        prevInvitations.filter(inv => inv.id !== invitationId)
      );
      
    } catch (err) {
      console.error('Error respondiendo a invitación:', err);
      
      // Revertir el estado de procesando
      setInvitations(prevInvitations => 
        prevInvitations.map(inv => 
          inv.id === invitationId 
            ? {...inv, processing: false} 
            : inv
        )
      );
      
      setError(`No se pudo ${status === 'accepted' ? 'aceptar' : 'rechazar'} la invitación: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [token]);

  const handleEventImageError = (e) => {
    e.target.onerror = null;
    // Intentar con ruta alternativa
    e.target.src = `${API_URL}/uploads/backgrounds/${e.target.getAttribute('data-image')}`;
    // Si vuelve a fallar, mostrar imagen por defecto
    e.target.onerror = () => {
      e.target.src = `${API_URL}/uploads/events/default-event.png`;
      e.target.onerror = null;
    };
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Invitaciones a eventos</h2>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-fuchsia-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchInvitations}
            className="mt-4 px-4 py-2 bg-fuchsia-100 text-fuchsia-700 rounded-md hover:bg-fuchsia-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : invitations.length > 0 ? (
        <div className="space-y-4">
          {invitations.map(invitation => (
            <div key={invitation.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex-shrink-0">
                  {invitation.event?.image ? (
                    <img
                      src={`${API_URL}/uploads/events/${invitation.event.image}`}
                      data-image={invitation.event.image}
                      alt={invitation.event.title || 'Evento'}
                      className="w-full h-full object-cover"
                      onError={handleEventImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                      {invitation.event?.title ? invitation.event.title.charAt(0).toUpperCase() : 'E'}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">{invitation.event?.title || 'Sin título'}</p>
                  <p className="text-gray-500 text-sm">
                    {invitation.event?.eventDate 
                      ? new Date(invitation.event.eventDate).toLocaleDateString() 
                      : invitation.event?.event_date
                        ? new Date(invitation.event.event_date).toLocaleDateString()
                        : 'Fecha no disponible'}
                  </p>
                  {invitation.invitedBy && (
                    <p className="text-gray-500 text-xs mt-1">
                      Invitado por: {invitation.invitedBy.username}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => handleEventInvitation(invitation.id, 'accepted')}
                  disabled={invitation.processing}
                  className={`px-4 py-2 ${
                    invitation.processing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white rounded transition-colors`}
                >
                  {invitation.processing ? 'Procesando...' : 'Aceptar'}
                </button>
                <button
                  onClick={() => handleEventInvitation(invitation.id, 'declined')}
                  disabled={invitation.processing}
                  className={`px-4 py-2 ${
                    invitation.processing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white rounded transition-colors`}
                >
                  {invitation.processing ? 'Procesando...' : 'Rechazar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
          </svg>
          <p className="text-gray-500">No tienes invitaciones pendientes</p>
        </div>
      )}
    </div>
  );
}

export default Invitations;