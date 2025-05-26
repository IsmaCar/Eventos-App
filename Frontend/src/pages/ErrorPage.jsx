/**
 * Página ErrorPage - Página de error para manejar errores de enrutamiento
 * Muestra información del error y opciones de navegación para el usuario
 * Se activa cuando hay errores 404, 500 o problemas de carga de rutas
 */
import React from 'react';
import { Link, useRouteError } from 'react-router-dom';


function ErrorPage() {
  const error = useRouteError();
  
  // Determinar el tipo de error y mensaje apropiado
  const getErrorInfo = () => {
    if (error?.status === 404) {
      return {
        title: 'Página no encontrada',
        message: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
        emoji: '🔍'
      };
    } else if (error?.status >= 500) {
      return {
        title: 'Error del servidor',
        message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
        emoji: '⚠️'
      };
    } else {
      return {
        title: 'Algo salió mal',
        message: error?.message || 'Ha ocurrido un error inesperado.',
        emoji: '😕'
      };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono de error */}
        <div className="text-8xl mb-6">
          {errorInfo.emoji}
        </div>
        
        {/* Título del error */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {errorInfo.title}
        </h1>
        
        {/* Mensaje descriptivo */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {errorInfo.message}
        </p>
        
        {/* Información técnica del error (solo en desarrollo) */}
        {import.meta.env.DEV && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-800 mb-2">Información del error:</h3>
            <p className="text-red-700 text-sm font-mono">
              {error.statusText || error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-red-800 cursor-pointer">Stack trace</summary>
                <pre className="text-xs text-red-600 mt-2 overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}
        
        {/* Botones de navegación */}
        <div className="space-y-4">
          <Link 
            to="/" 
            className="block w-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-medium hover:from-fuchsia-600 hover:to-indigo-600 transition-colors duration-200"
          >
            Ir al inicio
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;