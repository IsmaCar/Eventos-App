/**
 * Utilidades para el formateo de fechas
 */


// Formatea una fecha en formato largo (ej: 15 de mayo de 2023)

export const formatLongDate = (dateString) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};


// Verifica si una fecha ya ha pasado

export const isDatePassed = (dateString) => {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    const now = new Date();

    // Comparar fechas
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return eventDay < today;
  } catch (error) {
    return false;
  }
};


// Formatea una fecha en formato corto (ej: 15/05/2023)

export const formatShortDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida';

  try {
    const date = new Date(dateString);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};