import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

function EventInvitations({ eventId, onInvitationProcessed }) {
  const { token } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Función auxiliar para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha desconocida";
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (err) {
      return "Fecha inválida";
    }
  };
  
  // Función para obtener clase de estado
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Función para traducir el estado
  const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Desconocido';
    }
  };
  
  // Función para cargar las invitaciones
  const fetchInvitations = async () => {
    if (!token || !eventId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/events/${eventId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar invitaciones');
      }
      
      const data = await response.json();
      
      // Normalizar los datos de invitaciones si es necesario
      const normalizedInvitations = data.invitations.map(inv => {
        return {
          ...inv,
          id: inv.id,
          email: inv.email,
          status: inv.status,
          createdAt: inv.createdAt
        };
      });
      
      // Filtrar para mostrar solo las invitaciones pendientes
      const pendingInvitations = normalizedInvitations.filter(inv => inv.status === 'pending');
      
      setInvitations(pendingInvitations);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cancelar una invitación
  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('¿Estás seguro que deseas cancelar esta invitación?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Actualizar la lista sin recargar todo
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        
        // Notificar al componente padre si existe el callback
        if (typeof onInvitationProcessed === 'function') {
          onInvitationProcessed();
        }
      } else {
        throw new Error('Error al cancelar la invitación');
      }
    } catch (err) {
      alert('No se pudo cancelar la invitación');
    }
  };
  
  // Obtener las invitaciones al cargar el componente
  useEffect(() => {
    fetchInvitations();
  }, [eventId, token]);
  
  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Mostrar error
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Si no hay invitaciones
  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay invitaciones pendientes para este evento.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {/* Avatar o inicial */}
                    {invitation.invitedUser?.avatar ? (
                      <img 
                        className="h-8 w-8 rounded-full mr-3" 
                        src={`${API_URL}/uploads/avatars/${invitation.invitedUser.avatar}`} 
                        alt="" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <span className="text-indigo-700 font-medium text-sm">
                          {invitation.email ? invitation.email[0].toUpperCase() : "?"}
                        </span>
                      </div>
                    )}
                    
                    {/* Información del usuario */}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invitation.invitedUser 
                          ? (invitation.invitedUser.username || "Usuario sin nombre") 
                          : "Usuario no registrado"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invitation.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(invitation.status)}`}>
                    {translateStatus(invitation.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invitation.createdAt || invitation.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {invitation.status === 'pending' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Cancelar invitación
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EventInvitations;