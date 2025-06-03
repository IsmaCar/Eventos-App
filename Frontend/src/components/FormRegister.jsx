/**
 * Componente de formulario de registro de usuarios
 * Este componente gestiona el proceso completo de registro de nuevos usuarios:
 * - Captura y valida datos del formulario (nombre de usuario, email y contraseña)
 * - Envía los datos a la API mediante el contexto de autenticación
 * - Muestra retroalimentación visual del proceso mediante Toast notifications
 * - Redirecciona al usuario a la página de login tras un registro exitoso
 */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { useState } from "react";
import Spinner from "./Spinner";


function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '', 
    email: '',   
    password: '',  
  });
  
  const [loading, setLoading] = useState(false); 
  const { registerUser } = useAuth(); 
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const nombre = e.target.name;
    setFormData({ ...formData, [nombre]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.username || !formData.email || !formData.password) {
        error('Todos los campos son obligatorios');
        setLoading(false);
        return;
      }

      const registerResult = await registerUser(formData);

      // Si hay un error específico del backend, mostrarlo
      if (registerResult && registerResult.error) {
        error(registerResult.error);
        setLoading(false);
        return;
      }

      if (!registerResult) {
        error('Error al registrarse');
        setLoading(false);
        return;
      }

      success('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error('Error al registrarse:', err);

      if (err.message) {
        error(err.message);
      } else {
        error('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false); 
    }
  }
  
  return (
    <div className='max-w-md mx-auto my-10 p-5 bg-white rounded-lg shadow-lg'>
      <header className='text-2xl font-semibold text-center text-gray-800'>REGISTRARSE</header>

      <form onSubmit={handleSubmit} className='space-y-4 mt-6'>
        <section>
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
            className='w-full px-4 py-2 text-lg text-gray-900 border                        border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
        </section>
        <section>
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
            className='w-full px-4 py-2 text-lg text-gray-900 border                        border-gray-300 rounded-lg focus:outline-none focus:border-gray-500' />
        </section>
        <section>
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
            className='w-full px-4 py-2 text-lg text-gray-900 border                        border-gray-300 rounded-lg focus:outline-none focus:border-gray-500'/>
        </section>        
        <button
          type="submit"
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-gradient-to-r from-fuchsia-400 to-indigo-400 rounded-lg hover:scale-105 transition duration-300"
        >          {loading ? (
            <span className="flex items-center justify-center gap-3 w-full">
              <Spinner size="xs" color="white" />
              <span>Registrando...</span>
            </span>
          ) : (
            'Registrarse'
          )}        
        </button>
      </form>
    </div>
  )
}

export default RegisterForm;