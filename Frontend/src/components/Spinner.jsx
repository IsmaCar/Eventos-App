import React from 'react';


 // Componente de spinner para indicar estados de carga

function Spinner({ 
  size = 'lg', 
  color = 'indigo', 
  containerClassName = '', 
  fullScreen = false,
  text = '' 
}) {
  // Mapeo de tamaños
  const sizeClasses = {
    xs: 'h-6 w-6 border-2',
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-t-2 border-b-2',
    lg: 'h-16 w-16 border-t-2 border-b-2',
    xl: 'h-24 w-24 border-t-3 border-b-3'
  };

  // Colores disponibles
  const colorClasses = {
    indigo: 'border-indigo-500',
    fuchsia: 'border-fuchsia-500',
    purple: 'border-purple-500',
    pink: 'border-pink-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };

  // Contenedor base o pantalla completa
  const containerBaseClass = fullScreen 
    ? 'fixed inset-0 flex justify-center items-center bg-black/20 backdrop-blur-sm z-50' 
    : 'flex justify-center items-center';

  // Conjunto de clases para el contenedor con las opciones personalizables
  const containerClasses = `${containerBaseClass} ${containerClassName}`;

  // Conjunto de clases para el spinner con tamaño y color personalizables
  const spinnerClasses = `animate-spin rounded-full ${sizeClasses[size] || sizeClasses.lg} ${colorClasses[color] || colorClasses.indigo}`;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div className={spinnerClasses}></div>
        {text && <p className="mt-4 text-sm font-medium text-gray-600">{text}</p>}
      </div>
    </div>
  );
}

export default Spinner;