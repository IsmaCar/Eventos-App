/**
 * Hook personalizado para notificaciones Toast
 * 
 * Proporciona acceso fácil a la funcionalidad de toast con utilidades adicionales
 * Re-exporta el useToast del contexto con algunos métodos auxiliares
 */
import { useToast as useToastContext } from '../context/ToastContext';

export const useToast = () => {
  const toast = useToastContext();

  // Método auxiliar para mostrar un toast con solo un mensaje (caso más común)
  const notify = (message, type = 'info') => {
    switch (type) {
      case 'success':
        return toast.showSuccess(message);
      case 'error':
        return toast.showError(message);
      case 'warning':
        return toast.showWarning(message);
      case 'info':
      default:
        return toast.showInfo(message);
    }  };

  // Métodos rápidos para escenarios comunes
  const success = (message, options) => toast.showSuccess(message, options);
  const error = (message, options) => toast.showError(message, options);
  const warning = (message, options) => toast.showWarning(message, options);
  const info = (message, options) => toast.showInfo(message, options);

  return {
    ...toast,
    notify,
    success,
    error,
    warning,
    info,
  };
};

export default useToast;
