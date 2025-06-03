/**
* Componente de notificación - Notificación individual
*
* Muestra una sola notificación con diferentes tipos (éxito, error, advertencia, información)
* Incluye animaciones y función de cierre automático
*/
import React, { useEffect, useState } from 'react';

const Toast = ({ id, type = 'info', title, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Estados de animación
  useEffect(() => {
    // Animación de entrada
    const enterTimer = setTimeout(() => setIsVisible(true), 10);

    // Cierre automático
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 400); // Duración de la animación
  };

  // Configuraciones de tipos de toast
  const typeConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  return (
    <div
      className={`
        min-w-80 max-w-sm sm:max-w-md w-full ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg overflow-hidden
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icono */}
          <div className={`flex-shrink-0 ${config.iconColor} mt-0.5`}>
            {config.icon}
          </div>

          {/* Contenido - Espaciado mejorado con más padding a la derecha */}
          <div className="flex-1 min-w-0 pr-3">
            {title && (
              <p className={`text-sm font-semibold ${config.textColor} leading-5 mb-1`}>
                {title}
              </p>
            )}
            {message && (
              <p className={`text-sm ${config.textColor} leading-5 break-words`}>
                {message}
              </p>
            )}          </div>

          {/* Botón de cerrar - Mejor posicionado con más espacio */}
          <div className="flex-shrink-0 ml-2">
            <button
              onClick={handleClose}
              className={`
                inline-flex items-center justify-center w-8 h-8 rounded-md ${config.textColor} 
                hover:bg-gray-100 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-colors duration-200
              `}
              aria-label="Cerrar notificación"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-gray-200">
        <div
          className={`h-full ${type === 'success' ? 'bg-green-400' :
              type === 'error' ? 'bg-red-400' :
                type === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
            } transition-all duration-${duration} ease-linear`}
          style={{
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
