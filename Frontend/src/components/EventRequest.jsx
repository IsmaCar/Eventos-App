/**
 * Componente para gestionar las invitaciones a eventos recibidas por un usuario
 * 
 * Este componente permite al usuario:
 * - Visualizar todas las invitaciones a eventos pendientes
 * - Aceptar o rechazar invitaciones individualmente
 * - Ver información básica de cada evento al que ha sido invitado
 * - Conocer quién le ha invitado a cada evento
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import { formatShortDate } from '../utils/DateHelper';
import { useToast } from '../hooks/useToast';

const API_URL = import.meta.env.VITE_API_URL;

function EventRequest({ onInvitationProcessed }) {

  const { token } = useAuth();
  const toast = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Obtiene todas las invitaciones a eventos recibidas por el usuario
   * desde la API y actualiza el estado local
   */  const fetchInvitations = async () => {
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
      
      // Filtramos para mostrar solo invitaciones que requieren respuesta (pending)
      const pendingInvitations = (data.invitations || []).filter(inv => inv.status === 'pending');
      setInvitations(pendingInvitations);
    } catch (err) {
      console.error('Error obteniendo invitaciones:', err);
      toast.error('Error al cargar invitaciones');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };
  /**
   * Gestiona la respuesta del usuario a una invitación (aceptar o rechazar)
   * 
   * Flujo del proceso:
   * 1. Actualiza la UI para mostrar estado de procesamiento
   * 2. Envía la respuesta a la API (accept/reject)
   * 3. Elimina la invitación de la lista en caso de éxito
   * 4. Revierte el estado visual y muestra error en caso de fallo)
   */
  const handleEventInvitation = async (invitationId, status) => {
    try {
      setInvitations(prevInvitations => 
        prevInvitations.map(inv => 
          inv.id === invitationId 
            ? {...inv, processing: true} 
            : inv
        )
      );   

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
      // Elimina la invitación respondida de la lista local
      setInvitations(prevInvitations => 
        prevInvitations.filter(inv => inv.id !== invitationId)
      );
        // Mostrar mensaje de éxito
      const actionText = status === 'accepted' ? 'aceptada' : 'rechazada';
      toast.success(`Invitación ${actionText} correctamente`);
      
      // Notificar al componente padre del cambio si se proporciona callback
      if (typeof onInvitationProcessed === 'function') {
        onInvitationProcessed();
      }
      
    } catch (err) {
      console.error('Error respondiendo a invitación:', err);
      
      // Revierte el estado visual de procesamiento en caso de error
      setInvitations(prevInvitations => 
        prevInvitations.map(inv => 
          inv.id === invitationId 
            ? {...inv, processing: false} 
            : inv
        )
      );

      const actionText = status === 'accepted' ? 'aceptar' : 'rechazar';
      toast.error(`No se pudo ${actionText} la invitación`);
    }
  };


  useEffect(() => {
    fetchInvitations();
  }, [token]);

  
   // Maneja errores de carga de imágenes de eventos e intenta rutas alternativas
  const handleEventImageError = (e) => {
    e.target.onerror = null;
    // Intenta con ruta alternativa (backgrounds)
    e.target.src = `${API_URL}/uploads/backgrounds/${e.target.getAttribute('data-image')}`;
    // Si vuelve a fallar, muestra imagen por defecto
    e.target.onerror = () => {
      e.target.src = `${API_URL}/uploads/events/default-event.png`;
      e.target.onerror = null;
    };
  };
    return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Invitaciones a eventos</h2>
        {loading ? (
        <Spinner size="md" color="fuchsia" containerClassName="py-10" text="Cargando invitaciones..." />
      ) : 
    
      invitations.length > 0 ? (<main className="space-y-4">          
      {invitations.map(invitation => (
            <article key={invitation.id} className="bg-gray-50 p-4 rounded-lg">
              {/* Información básica del evento */}
              <header className="flex items-center">
                {/* Imagen o inicial del evento */}
                <figure className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex-shrink-0">
                  {invitation.event?.image ? (
                    <img
                      src={`${API_URL}/uploads/events/${invitation.event.image}`}
                      data-image={invitation.event.image}
                      alt={invitation.event.title || 'Evento'}
                      className="w-full h-full object-cover"
                      onError={handleEventImageError}
                    />
                  ) : (
                    <aside className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                      {invitation.event?.title ? invitation.event.title.charAt(0).toUpperCase() : 'E'}
                    </aside>
                  )}
                </figure>
                {/* Detalles del evento */}
                <section className="ml-4">
                  <p className="text-gray-800 font-medium">{invitation.event?.title || 'Sin título'}</p>                  <p className="text-gray-500 text-sm">
                    {invitation.event?.eventDate 
                      ? formatShortDate(invitation.event.eventDate) 
                      : invitation.event?.event_date
                        ? formatShortDate(invitation.event.event_date)
                        : 'Fecha no disponible'}
                  </p>                  
                  {/* Información de quién envió la invitación */}
                  {invitation.invitedBy && (
                    <p className="text-gray-500 text-xs mt-1">
                      Invitado por: {invitation.invitedBy.username}
                    </p>
                  )}
                </section>
              </header>
              {/* Botones de acción para aceptar o rechazar */}
              <nav className="flex justify-end space-x-2 mt-4">
                {/* Botón para aceptar invitación */}
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
                {/* Botón para rechazar invitación */}
                <button
                  onClick={() => handleEventInvitation(invitation.id, 'declined')}
                  disabled={invitation.processing}
                  className={`px-4 py-2 ${
                    invitation.processing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white rounded transition-colors`}                >
                  {invitation.processing ? 'Procesando...' : 'Rechazar'}
                </button>
              </nav>
            </article>
          ))}        
        </main>
      ) : (
        // Estado vacío - No hay invitaciones pendientes
        <article className="text-center py-10">          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
          </svg>
          <p className="text-gray-500">No tienes invitaciones pendientes</p>
        </article>
      )}
    </div>
  );
}

export default EventRequest;