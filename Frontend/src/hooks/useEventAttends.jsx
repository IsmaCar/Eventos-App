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
  const { error } = useToast();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState(null);

  // Cargar asistentes del evento
  const fetchAttendees = useCallback(async () => {
    if (!eventId || !token) return;

    try {
      setLoading(true);

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
      error(error.message);
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
      error('No autenticado o ID de evento inválido');
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
      error(`Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setProcessingAction(false);
    }
  };  
  
  // Eliminar asistente (solo organizador) - Inicia el proceso de confirmación
  const removeAttendee = (attendeeId) => {
    setAttendeeToRemove(attendeeId);
    setShowRemoveConfirmation(true);
  };

  // Confirmar eliminación de asistente
  const confirmRemoveAttendee = async () => {
    if (!attendeeToRemove) return { success: false, error: 'No hay asistente seleccionado' };

    if (!token || !isEventCreator || !eventId) {
      error('No tienes permisos para realizar esta acción');
      return { success: false, error: 'No tienes permisos para realizar esta acción' };
    }

    try {
      setProcessingAction(true);

      const response = await fetch(`${API_URL}/api/events/${eventId}/remove-attendee/${attendeeToRemove}`, {
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
      setAttendees(prev => prev.filter(attendee => parseInt(attendee.id) !== parseInt(attendeeToRemove)));

      // Mostrar mensaje de éxito con toast
      const removedAttendee = attendees.find(a => parseInt(a.id) === parseInt(attendeeToRemove));
      const attendeeName = removedAttendee ? removedAttendee.username : 'Usuario';
      toast.success(`${attendeeName} ha sido eliminado del evento correctamente`);
      // Limpiar estado
      setShowRemoveConfirmation(false);
      setAttendeeToRemove(null);

      return { success: true };
      
    } catch (error) {
      error(`Error: ${error.message}`);
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
    confirmRemoveAttendee,
    showRemoveConfirmation,
    setShowRemoveConfirmation,
    attendeeToRemove,
    setAttendeeToRemove,
    refreshAttendees: fetchAttendees
  };
}