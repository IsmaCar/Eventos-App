/**
 * Hook para gestionar los asistentes de un evento
 * Se encarga de:
 * - Cargar la lista de asistentes
 * - Cancelar asistencia del usuario actual (con confirmación)
 * - Permitir al organizador eliminar asistentes (con confirmación)
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './useToast';

const API_URL = import.meta.env.VITE_API_URL;

export function useEventAttendees(eventId, isEventCreator) {
  const { user, token } = useAuth();
  const toast = useToast();
  
  // Estados para asistentes
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Estado para manejar confirmación de cancelar asistencia
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  // Cargar asistentes del evento
  const fetchAttendees = useCallback(async () => {
    if (!eventId || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/events/${eventId}/attendees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('No se pudieron cargar los asistentes');
      }
      
      const data = await response.json();
      setAttendees(data.attendees || []);
    } catch (error) {
      console.error('Error al cargar los asistentes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  // Cargar asistentes al inicializar
  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);
  // Cancelar asistencia del usuario actual - Solo inicia el proceso de confirmación
  const cancelAttendance = () => {
    setShowCancelConfirmation(true);
  };

  // Confirmar cancelación de asistencia
  const confirmCancelAttendance = async () => {
    if (!token || !eventId) {
      toast.error('No autenticado o ID de evento inválido');
      return { success: false, error: 'No autenticado o ID de evento inválido' };
    }
    
    try {
      setProcessingAction(true);
      
      const response = await fetch(`${API_URL}/api/events/${eventId}/cancel-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo cancelar la asistencia');
      }
      
      // Actualizar la lista de asistentes quitando al usuario actual
      if (user) {
        setAttendees(prev => prev.filter(attendee => parseInt(attendee.id) !== parseInt(user.id)));
      }
      
      // Mostrar mensaje de éxito con toast
      toast.success('Has cancelado tu asistencia al evento correctamente');
      setShowCancelConfirmation(false);
      return { success: true };
    } catch (error) {
      console.error("Error cancelando asistencia:", error);
      toast.error(`Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setProcessingAction(false);
    }
  };
  // Eliminar asistente (solo organizador) CON CONFIRMACIÓN
  const removeAttendee = async (attendeeId) => {
    // Solicitar confirmación con toast en lugar de confirm nativo
    if (!window.confirm('¿Estás seguro de que deseas eliminar a este usuario del evento?')) {
      return { success: false, canceled: true };
    }
    
    if (!token || !isEventCreator || !eventId) {
      toast.error('No tienes permisos para realizar esta acción');
      return { success: false, error: 'No tienes permisos para realizar esta acción' };
    }
    
    try {
      setProcessingAction(true);
      
      const response = await fetch(`${API_URL}/api/events/${eventId}/remove-attendee/${attendeeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar al asistente');
      }
      
      // Actualizar la lista de asistentes eliminando al usuario removido
      setAttendees(prev => prev.filter(attendee => parseInt(attendee.id) !== parseInt(attendeeId)));
      
      // Mostrar mensaje de éxito con toast
      toast.success('Usuario eliminado del evento correctamente');
      return { success: true };
    } catch (error) {
      console.error("Error eliminando asistente:", error);
      toast.error(`Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setProcessingAction(false);
    }
  };

  // Verificar si el usuario actual es asistente
  const isCurrentUserAttending = useCallback(() => {
    if (!user || !attendees.length) return false;
    return attendees.some(attendee => parseInt(attendee.id) === parseInt(user.id));
  }, [attendees, user]);

  // Verificar si un usuario específico es el organizador
  const isAttendeeOrganizer = useCallback((attendeeId) => {
    if (!attendees.length) return false;
    const attendee = attendees.find(a => parseInt(a.id) === parseInt(attendeeId));
    return attendee ? attendee.isCreator : false;
  }, [attendees]);
  return {
    attendees,
    loading,
    error,
    processingAction,
    isCurrentUserAttending,
    isAttendeeOrganizer,
    cancelAttendance,
    confirmCancelAttendance,
    showCancelConfirmation,
    setShowCancelConfirmation,
    removeAttendee,
    refreshAttendees: fetchAttendees
  };
}