/**
 * Utilidades para el formateo de fechas
 */

/**
 * Formatea una fecha en formato largo (ej: 15 de mayo de 2023)
 * @param {string} dateString - Fecha en formato ISO o string válido para Date
 * @returns {string} Fecha formateada
 */
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

/**
 * Verifica si una fecha ya ha pasado
 * @param {string} dateString - Fecha en formato ISO o string válido para Date
 * @returns {boolean} true si la fecha ya pasó, false en caso contrario
 */
export const isDatePassed = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    return date < now;
  } catch (error) {
    return false;
  }
};