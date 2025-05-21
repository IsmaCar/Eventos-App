import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';

const API_URL = import.meta.env.VITE_API_URL;

function ReceivedInvitations({ onInvitationProcessed }) {
  const { token } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvitations = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/invitations/user/received`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar invitaciones');
      }
      
      const data = await response.json();
      
      // Importante: Filtrar para mostrar SOLO las invitaciones pendientes
      const pendingInvitations = data.invitations.filter(inv => inv.status === 'pending');
      
      setInvitations(pendingInvitations);
      setError(null);
    } catch (err) {
      console.error('Error obteniendo invitaciones:', err);
      setError('No se pudieron cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'  // Añadido Content-Type
        },
        body: JSON.stringify({
          response: 'accept'  // Añadido parámetro response
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al aceptar la invitación');
      }
      
      // Eliminar la invitación de la lista mostrada
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      // Notificar al componente padre si existe el callback
      if (typeof onInvitationProcessed === 'function') {
        onInvitationProcessed();
      }
    } catch (err) {
      console.error('Error aceptando invitación:', err);
      alert('No se pudo aceptar la invitación');
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    try {
      const response = await fetch(`${API_URL}/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'  // Añadido Content-Type
        },
        body: JSON.stringify({
          response: 'reject'  // Añadido parámetro response
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al rechazar la invitación');
      }
      
      // Eliminar la invitación de la lista mostrada
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      // Notificar al componente padre si existe el callback
      if (typeof onInvitationProcessed === 'function') {
        onInvitationProcessed();
      }
    } catch (err) {
      console.error('Error rechazando invitación:', err);
      alert('No se pudo rechazar la invitación');
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [token]);

  // Mostrar estado de carga
  if (loading) {
    return <Spinner size="md" color="fuchsia" containerClassName="py-8" text="Cargando invitaciones..." />;
  }

  // Mostrar error
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-2">
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
      <div className="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p>No tienes invitaciones pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map(invitation => (
        <div key={invitation.id} className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{invitation.event?.title || "Evento sin título"}</h3>
                <p className="text-gray-600 text-sm">
                  {invitation.event?.eventDate 
                    ? new Date(invitation.event.eventDate).toLocaleDateString() 
                    : "Fecha no disponible"}
                </p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>Invitado por: <span className="font-medium">{invitation.invitedBy?.username || "Usuario desconocido"}</span></p>
            </div>
            
            <div className="mt-4 flex space-x-2 justify-end">
              <button
                onClick={() => handleAcceptInvitation(invitation.id)}
                className="px-4 py-2 bg-fuchsia-600 text-white text-sm rounded-md hover:bg-fuchsia-700 transition-colors"
              >
                Aceptar
              </button>
              <button
                onClick={() => handleRejectInvitation(invitation.id)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReceivedInvitations;