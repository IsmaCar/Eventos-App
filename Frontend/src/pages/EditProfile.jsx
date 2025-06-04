import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, handleAvatarError } from '../utils/Imagehelper';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast'

const API_URL = import.meta.env.VITE_API_URL;

function EditProfile() {
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);


  // Procesa el cambio de avatar, crea vista previa y sube el archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      uploadAvatar(file);
    }
  }

  // Sube el avatar al servidor y actualiza el estado de la aplicación
  const uploadAvatar = async (file) => {
    setUpdating(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_URL}/api/users/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      error(errorData.error || errorData.message || 'Error al subir el avatar');
      setUpdating(false);
      return;
    }

      const data = await response.json();

      // Obtener la ruta del avatar según la estructura de respuesta del servidor
      const avatarPath = data.user?.avatar;

      if (!avatarPath) {
        error('No se pudo obtener la ruta del avatar');
        setUpdating(false)
      }

      // Actualizar el contexto con la nueva ruta de avatar
      updateUser({
        ...user,
        avatar: typeof avatarPath === 'string' ? avatarPath : JSON.stringify(avatarPath)
      });

      // Actualizar la vista previa con la nueva URL
      const fullAvatarUrl = getAvatarUrl(avatarPath);      
      const timestamp = new Date().getTime();
      setPreview(`${fullAvatarUrl}?t=${timestamp}`);

      success('Avatar actualizado con éxito');

    } catch (err) {
      error('Error al subir el avatar: ' + (err.message || 'Intenta de nuevo'));
      setPreview(null);
    } finally {
      setUpdating(false);
    }
  }


  // Actualiza el estado del formulario al cambiar los campos

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }
  // Procesa la actualización del perfil con validaciones
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {      
      // Validar cambio de contraseña
      if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          error('Debes introducir tu contraseña actual para cambiar la contraseña');
          setLoading(false);
          return;
        }

        if (!formData.newPassword) {
          error('Debes introducir una nueva contraseña');
          setLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          error('Las contraseñas nuevas no coinciden');
          setLoading(false);
          return;
        }
      }

      // Preparar datos para enviar
      const dataToUpdate = {
        username: formData.username,
        email: formData.email
      };

      // Incluir contraseñas solo si se están cambiando
      if (formData.newPassword) {
        dataToUpdate.currentPassword = formData.currentPassword;
        dataToUpdate.newPassword = formData.newPassword;
      }

      // Verificar si se están cambiando credenciales críticas
      const isChangingEmail = formData.email !== user.email;
      const isChangingPassword = !!formData.newPassword;
      const hasCriticalChanges = isChangingEmail || isChangingPassword;

      const response = await fetch(`${API_URL}/api/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToUpdate)
      });      
      if (!response.ok) {
        // Obtener el mensaje de error específico del backend
        const errorData = await response.json();
        error(errorData.error || 'Error al actualizar el perfil');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (hasCriticalChanges) {
        logout();
        window.location.href = '/login';
        return;      
      } else {
        // Solo cambios menores (username): actualizar contexto y continuar
        success('Perfil actualizado con éxito');
        if (data.user) {
          updateUser(data.user);
        }

        // Reiniciar campos de contraseña
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }    
    } catch (err) {
      error('Error al actualizar el perfil, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  // Determinar la URL del avatar a mostrar
  const avatarUrl = preview || getAvatarUrl(user?.avatar);

  return (
    <div className="max-w-4xl mx-auto my-10 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Editar Perfil</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Columna para el avatar */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="mb-4 relative">
            <img
              src={avatarUrl}
              alt="Avatar de perfil"
              className="rounded-full w-48 h-48 object-cover border-4 border-fuchsia-300"
              onError={handleAvatarError}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-2 right-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-full p-2 transition-colors duration-200 shadow-md"
              aria-label="Cambiar avatar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
            />
          </div>
          {updating && (
            <div className="flex items-center gap-2 text-fuchsia-600 mt-2">
              <Spinner size="xs" color="fuchsia" />
              <span>Actualizando avatar...</span>
            </div>
          )}
        </div>        
        {/* Columna para el formulario */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 gap-6">
              {/* Campos principales */}
              <div>
                <label htmlFor="username" className="block text-lg font-medium text-gray-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                />
              </div>

              {/* Sección para cambio de contraseña */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cambiar contraseña</h3>

                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-lg font-medium text-gray-700 mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-lg font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-lg font-medium text-gray-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end mt-8 space-x-3">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none transition duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-lg hover:scale-105 focus:outline-none transition duration-300 shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="xs" color="white" />
                    <span>Guardando...</span>
                  </div>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile