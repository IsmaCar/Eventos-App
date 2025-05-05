/**
 * Utilidades para el manejo de imágenes en la aplicación
 */

/**
 * Obtiene la URL completa de una imagen
 * @param {string} imagePath - Ruta relativa de la imagen
 * @returns {string|null} - URL completa de la imagen o null si no hay ruta
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Si la ruta ya incluye el dominio completo, devolverla tal cual
    if (imagePath.startsWith('http')) return imagePath;
    
    // Normalizar la ruta para asegurar que comienza con /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Usar la variable de entorno para la URL base
    return `${import.meta.env.VITE_API_URL}${normalizedPath}`;
};

/**
 * Genera clases condicionales para las tarjetas de eventos
 * @param {Object} event - El evento
 * @returns {string} - Clases CSS para la tarjeta
 */
export const eventCardClasses = (event) => {
    const baseClasses = "relative rounded-xl h-64 overflow-hidden group shadow-md hover:shadow-lg transition-all duration-300";
    
    if (event.image) {
        return `${baseClasses} bg-cover bg-center`;
    } else {
        return `${baseClasses} bg-gradient-to-br from-fuchsia-500 via-pink-500 to-indigo-500`;
    }
};

/**
 * Genera un fondo aleatorio para eventos sin imagen
 * Útil para crear variedad visual en las tarjetas
 * @returns {string} - Clase CSS con un gradiente vibrante aleatorio
 */
export const getRandomGradient = () => {
    const gradients = [
        "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-indigo-500",
        "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500",
        "bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500",
        "bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500",
        "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
};

/**
 * Verifica si una URL de imagen es válida
 * @param {string} url - URL de la imagen
 * @returns {Promise<boolean>} - Promise que resuelve a true si la imagen es válida
 */
export const isValidImageUrl = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
};

/**
 * Formatea el tamaño de archivo a unidades legibles
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado (ej: "2.5 MB")
 */
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
};