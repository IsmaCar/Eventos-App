/**
 * Componente para gestionar las invitaciones de un evento desde la perspectiva del organizador
 * Permite visualizar todas las invitaciones pendientes y cancelarlas si es necesario
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import { formatLongDate } from '../utils/DateHelper';
import { useToast } from '../hooks/useToast';
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Traduce el estado de la invitación a español
 */
const translateStatus = (status) => {
  const statusMap = {
    'pending': 'Pendiente',
    'accepted': 'Aceptada',
    'declined': 'Rechazada',
    'cancelled': 'Cancelada'
  };
  return statusMap[status] || status;
};

function EventInvitationOrganizer({ eventId, onInvitationProcessed }) {
  const { token } = useAuth();
  const toast = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);


  /**
   * Obtiene las invitaciones del evento desde la API
   * - Filtra para mostrar solo invitaciones pendientes
   * - Normaliza la estructura de datos recibida
   */
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

      // Solo mostramos las invitaciones pendientes que pueden ser gestionadas    
      const pendingInvitations = (data.invitations || data || []).filter(inv => inv.status === 'pending');
      setInvitations(pendingInvitations);
    } catch (err) {
      toast.error('No se pudieron cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  };

  /**
 * Maneja la cancelación de una invitación pendiente
 * - Solicita confirmación al usuario
 * - Envía petición DELETE a la API
 * - Actualiza la lista de invitaciones sin recargar desde el servidor
 * - Notifica al componente padre del cambio
 */
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
        // Actualiza el estado local eliminando la invitación cancelada
        setInvitations(invitations.filter(inv => inv.id !== invitationId));

        toast.success('Invitación cancelada correctamente');

        // Notifica al componente padre del cambio 
        if (typeof onInvitationProcessed === 'function') {
          onInvitationProcessed();
        }
      } else {
        throw new Error('Error al cancelar la invitación');
      }
    } catch (err) {
      toast.error('No se pudo cancelar la invitación');
    }
  };

  /**
   * Efecto para cargar las invitaciones al montar el componente
   * o cuando cambian el eventId o token
   */
  useEffect(() => {
    fetchInvitations();
  }, [eventId, token]);
  if (loading) {
    return <Spinner size="md" color="indigo" containerClassName="py-8" text="Cargando invitaciones..." />;
  }
  if (invitations.length === 0) {
    return (
      <section className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay invitaciones pendientes para este evento.</p>
      </section>
    );
  }
  return (
    <>
      <article className="overflow-x-auto">
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
                <figure className="flex items-center">
                  {/* Avatar o inicial */}
                  {invitation.invitedUser?.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full mr-3"
                      src={`${API_URL}/uploads/avatars/${invitation.invitedUser.avatar}`}
                      alt="Avatar de usuario"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                      }}
                    />
                  ) : (
                    <aside className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <span className="text-indigo-700 font-medium text-sm">
                        {invitation.email ? invitation.email[0].toUpperCase() : "?"}
                      </span>
                    </aside>
                  )}

                  {/* Información del usuario */}
                  <figcaption>
                    <header className="text-sm font-medium text-gray-900">
                      {invitation.invitedUser
                        ? (invitation.invitedUser.username || "Usuario sin nombre")
                        : "Usuario no registrado"}
                    </header>
                    <address className="text-sm text-gray-500">
                      {invitation.email}
                    </address>
                  </figcaption>
                </figure>
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {translateStatus(invitation.status)}
                  </span>                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLongDate(invitation.createdAt || invitation.created_at) || "Fecha desconocida"}
                </td>                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {invitation.status === 'pending' && (
                    <nav className="flex justify-end">
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Cancelar invitación
                      </button>
                    </nav>
                  )}
              </td>
              </tr>
            ))}          
          </tbody>
        </table>
      </article>
    </>
  );
}

export default EventInvitationOrganizer;