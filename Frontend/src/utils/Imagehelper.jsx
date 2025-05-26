/**
 * Utilidades para el manejo de imágenes en la aplicación
 */

const API_URL = import.meta.env.VITE_API_URL;

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

/**
 * Genera la URL completa para un avatar de usuario
 * @param {string|null} avatarFilename - Nombre del archivo de avatar del usuario
 * @returns {string} URL completa del avatar
 */
export const getAvatarUrl = (avatarFilename) => {
    if (!avatarFilename || avatarFilename.trim() === '') {
        return `${API_URL}/uploads/avatars/default-avatar.png`;
    }
    
    // Si ya es una URL completa, devolverla tal cual
    if (avatarFilename.startsWith('http')) return avatarFilename;
    
    return `${API_URL}/uploads/avatars/${avatarFilename}`;
};

/**
 * Manejador de error para imágenes de avatar, establece la imagen por defecto
 * @param {Event} event - Evento onError de la imagen
 */
export const handleAvatarError = (event) => {
    // Prevenir bucles infinitos desactivando el evento onerror
    event.target.onerror = null;
    
    // Verificar si la imagen que falló ya es la de default-avatar.png
    const src = event.target.src || '';
    const isDefaultAvatar = src.includes('default-avatar.png');
    
    if (!isDefaultAvatar) {
        // Solo intentar cargar el avatar por defecto si no es el que ya estaba fallando
        event.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
    } else {
        // Si el avatar por defecto también falla, ocultamos la imagen
        event.target.style.display = 'none';
        // Y añadimos una clase al contenedor para mostrar un fondo de color
        if (event.target.parentNode) {
            event.target.parentNode.classList.add('avatar-fallback');
        }
    }
};

/**
 * Genera las iniciales de un nombre de usuario para usarlas como avatar fallback
 * @param {string} username - Nombre de usuario del que extraer iniciales
 * @returns {string} Iniciales en mayúscula (o primera letra si solo hay una palabra)
 */
export const getUserInitials = (username) => {
    if (!username) return '';
    
    const names = username.trim().split(' ');
    if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Componente para avatar con fallback a iniciales o imagen por defecto
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Objeto usuario con avatar y username
 * @param {string} props.className - Clases adicionales para el contenedor
 * @param {string} props.size - Tamaño del avatar (sm, md, lg, xl)
 * @returns {JSX.Element} Elemento de avatar
 */
export const Avatar = ({ user, className = '', size = 'md' }) => {
    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-24 h-24 text-2xl'
    };
    
    const containerClass = `${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400 flex-shrink-0 ${className}`;
    
    if (!user) {
        return (
            <div className={containerClass}>
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    ?
                </div>
            </div>
        );
    }
    
    const avatarUrl = getAvatarUrl(user.avatar);
    
    return (
        <div className={containerClass}>
            {user.avatar ? (
                <img
                    src={avatarUrl}
                    alt={`Avatar de ${user.username || 'usuario'}`}
                    className="w-full h-full object-cover"
                    onError={handleAvatarError}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {getUserInitials(user.username)}
                </div>
            )}
        </div>
    );
};

/**
 * Obtiene las clases adecuadas para una imagen de perfil según el tamaño
 * @param {string} size - Tamaño deseado (sm, md, lg, xl)
 * @returns {string} - Cadena de clases CSS
 */
export const getProfileImageClasses = (size = 'md') => {
    const baseClasses = "rounded-full overflow-hidden bg-gradient-to-r from-fuchsia-400 to-indigo-400";
    
    const sizeClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-24 h-24'
    };
    
    return `${baseClasses} ${sizeClasses[size] || sizeClasses.md}`;
};

/**
 * Genera URL para la portada de un perfil o evento
 * @param {string|null} coverImage - Nombre del archivo de portada
 * @returns {string} URL completa de la portada o gradiente predeterminado
 */
export const getCoverImageStyle = (coverImage) => {
    if (!coverImage) {
        return { 
            background: 'linear-gradient(to right, #6d28d9, #db2777)' 
        };
    }
    
    return { 
        backgroundImage: `url(${getImageUrl(coverImage)})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    };
};