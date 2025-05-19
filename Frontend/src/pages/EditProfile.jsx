import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, handleAvatarError, Avatar } from '../utils/Imagehelper';
import Spinner from '../components/Spinner';

const API_URL = import.meta.env.VITE_API_URL;

function EditProfile() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Estados para el manejo del formulario y la experiencia del usuario
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  /**
   * Maneja el cambio de archivo para la imagen de perfil
   * Crea una vista previa y sube el avatar automáticamente
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Crear una URL de vista previa del archivo
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Subir la imagen inmediatamente
      uploadAvatar(file);
    }
  }

  /**
   * Realiza la subida del avatar al servidor
   * Actualiza el contexto de usuario cuando es exitoso
   */
  const uploadAvatar = async (file) => {
    setUpdating(true);
    setSuccess('');
    setError('');

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

      if(!response.ok) {
        throw new Error('Error al subir el avatar');
      }

      setSuccess('Avatar actualizado con éxito');
      // Actualizar el avatar del usuario en el contexto
      const data = await response.json();
      updateUser({ ...user, avatar: data.avatar });
      
    } catch (error) {
      console.error('Error al subir el avatar', error);
      setError('Error al subir el avatar, intenta de nuevo');
    } finally {
      setUpdating(false);
    }
  }

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  /**
   * Procesa el envío del formulario para actualizar el perfil
   * Incluye validaciones para el cambio de contraseña
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Validar los campos de contraseña si alguno está presente
      if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          setError('Debes introducir tu contraseña actual para cambiar la contraseña');
          setLoading(false);
          return;
        }
        
        if (!formData.newPassword) {
          setError('Debes introducir una nueva contraseña');
          setLoading(false);
          return;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Las contraseñas nuevas no coinciden');
          setLoading(false);
          return;
        }
      }

      // Preparar los datos a enviar (solo incluir la contraseña si se está cambiando)
      const dataToUpdate = {
        username: formData.username,
        email: formData.email
      };
      
      // Agregar campos de contraseña solo si se está intentando cambiar
      if (formData.newPassword) {
        dataToUpdate.currentPassword = formData.currentPassword;
        dataToUpdate.newPassword = formData.newPassword;
      }

      const response = await fetch(`${API_URL}/api/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToUpdate)  
      });

      if(!response.ok) {
        response.status === 409 ? setError('El nombre de usuario o el correo electrónico ya están en uso') 
                                : setError('Error al actualizar el perfil');
        setLoading(false);
        return;
      }
    
      setSuccess('Perfil actualizado con éxito');
      const data = await response.json();
      if(data.user) {
        updateUser(data.user); 
      } 
      
      // Limpiar los campos de contraseña después de la actualización  
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error al actualizar el perfil', error);
      setError('Error al actualizar el perfil, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  // URL del avatar actual o vista previa
  const avatarUrl = preview || getAvatarUrl(user?.avatar);

  return (
    <div className="max-w-4xl mx-auto my-10 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Editar Perfil</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Columna de Avatar */}
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
  
        {/* Columna de Formulario */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensajes de error y éxito */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                {success}
              </div>
            )}
  
            <div className="grid grid-cols-1 gap-6">
              {/* Nombre de usuario */}
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
  
              {/* Email */}
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
  
              {/* Sección de cambio de contraseña */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cambiar contraseña</h3>
                
                {/* Contraseña actual */}
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
                
                {/* Nueva contraseña */}
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
                
                {/* Confirmar nueva contraseña */}
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