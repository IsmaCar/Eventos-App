import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [invitationData, setInvitationData] = useState(null);
  const { registerUser, loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('') // Nuevo estado para mensajes de éxito
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false);

  // Buscar token de invitación en la URL cuando el componente se monta
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('invitation');

    if (token) {
      verifyInvitation(token);
    }
  }, [location]);

  // Función para verificar el token de invitación
  const verifyInvitation = async (token) => {
    try {
      setVerifying(true);
      const response = await axios.get(`/api/invitations/verify/${token}`);

      setInvitationData({
        ...response.data.invitation,
        token
      });

      // Prellenar el email si está disponible
      if (response.data.invitation.email) {
        setFormData(prev => ({
          ...prev,
          email: response.data.invitation.email
        }));
      }

      setSuccess('¡Tienes una invitación para un evento!');
    } catch (error) {
      console.error('Error al verificar la invitación:', error);
      setError('La invitación no es válida o ha expirado');
    } finally {
      setVerifying(false);
    }
  };

  //Función para manejar el cambio de los inputs
  const handleChange = (e) => {
    const nombre = e.target.name;
    setFormData({ ...formData, [nombre]: e.target.value })
    // Limpiar mensajes al cambiar los datos
    setError('');
    setSuccess('');
  }

  //Función para manejar el submit del formulario
  // Se encarga de validar los datos y llamar a la función registerUser
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (!formData.username || !formData.email || !formData.password) {
        setError('Todos los campos son obligatorios')
        setLoading(false)
        return
      }

      // Registrar el usuario
      const registerResult = await registerUser(formData)

      if (!registerResult) {
        setError('Error al registrarse')
        setLoading(false)
        return
      }

      // Si hay una invitación, iniciar sesión automáticamente y aceptar la invitación
      if (invitationData) {
        try {
          // Iniciar sesión
          const loginResult = await loginUser({
            email: formData.email,
            password: formData.password
          });

          if (loginResult) {
            // Aceptar la invitación automáticamente
            try {
              await axios.post(
                `/api/invitations/${invitationData.id}/respond`,
                { response: 'accept' },
                {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
              );

              setSuccess('¡Te has unido al evento correctamente!');

              // Pequeño retraso para que el usuario vea el mensaje de éxito
              setTimeout(() => {
                // Redirigir al evento
                navigate(`/events/${invitationData.event.id}`);
              }, 1500);
              return;
            } catch (error) {
              console.error('Error al aceptar la invitación:', error);
              setSuccess('Registro exitoso, pero hubo un problema al unirte al evento');

              // Pequeño retraso antes de redirigir
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
              return;
            }
          } else {
            // Si falla el inicio de sesión, redirigir al login
            setSuccess('Registro exitoso. Por favor, inicia sesión para acceder a tu invitación');

            // Pequeño retraso antes de redirigir
            setTimeout(() => {
              navigate('/login');
            }, 1500);
            return;
          }
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          setSuccess('Registro exitoso. Por favor, inicia sesión manualmente');

          // Pequeño retraso antes de redirigir
          setTimeout(() => {
            navigate('/login');
          }, 1500);
          return;
        }
      } else {
        // Si no hay invitación, redirigir al login normalmente
        setSuccess('¡Registro exitoso!');

        // Pequeño retraso antes de redirigir
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }

    } catch (error) {
      console.error('Error al registrarse:', error);

      if (error.response && error.response.data) {
        setError(error.response.data.error || 'Error del servidor');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-lg">Verificando invitación...</span>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto my-10 p-5 bg-white rounded-lg shadow-lg'>
      <h2 className='text-2xl font-semibold text-center text-gray-800'>REGISTRARSE</h2>

      {invitationData && (
        <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded relative mt-4 mb-4">
          <p className="font-medium">¡Has sido invitado al evento <span className="font-bold">{invitationData.event.title}</span>!</p>
          <p className="text-sm">Completa tu registro para unirte automáticamente.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor="text"
            className="block text-xl font-semibold text-gray-900"
          >
            Nombre de usuario
          </label>
          <input type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className='w-full px-4 py-2 text-lg text-gray-900 border 
                                    border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-xl font-semibold text-gray-900"
          >
            Correo Electrónico
          </label>
          <input type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!invitationData?.email}
            className={`w-full px-4 py-2 text-lg text-gray-900 border 
                                    border-gray-300 rounded-lg focus:outline-none focus:border-gray-500
                                    ${invitationData?.email ? 'bg-gray-100' : ''}`} />
          {invitationData?.email && (
            <p className="text-xs text-gray-600 mt-1">
              * El email no se puede cambiar porque está vinculado a tu invitación
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xl font-semibold text-gray-900"
          >
            Contraseña
          </label>
          <input type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className='w-full px-4 py-2 text-lg text-gray-900 border 
                                    border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-gradient-to-r from-fuchsia-400 to-indigo-400 rounded-lg hover:scale-105 transition duration-300"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span>Registrando...</span>
            </div>
          ) : (
            invitationData ? 'Registrarse y unirse al evento' : 'Registrarse'
          )}
        </button>
      </form>
    </div>
  )
}

export default RegisterForm;