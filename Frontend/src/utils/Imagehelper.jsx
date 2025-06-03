/**
 * Utilidades para el manejo de imágenes en la aplicación
 */

const API_URL = import.meta.env.VITE_API_URL;

// Constantes para validación de archivos
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Valida si un archivo cumple con los requisitos de tamaño y tipo
 */
export const validateImageFile = (file) => {
    const errors = [];

    if (!file) {
        errors.push('No se ha seleccionado ningún archivo');
        return { isValid: false, errors };
    }

    // Validar tipo de archivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push('Formato de archivo no válido. Solo se permiten JPG, PNG, WEBP y GIF.');
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`El archivo es demasiado grande. El tamaño máximo es de ${formatFileSize(MAX_FILE_SIZE)}.`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Obtiene la URL completa de una imagen
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
 * Genera un gradiente determinístico basado en un identificador
 */
export const getRandomGradient = (id = null) => {
    const gradients = [
        "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-indigo-500",
        "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500",
        "bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500",
        "bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500",
        "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
    ];
    
    // Si se proporciona un ID, usarlo para generar un índice determinístico
    if (id !== null && id !== undefined) {
        const index = Math.abs(parseInt(id) || 0) % gradients.length;
        return gradients[index];
    }
    
    // Si no hay ID, devolver el primer gradiente como fallback
    return gradients[0];
};

/**
 * Verifica si una URL de imagen es válida
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
 */
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
};

/**
 * Genera la URL completa para un avatar de usuario
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