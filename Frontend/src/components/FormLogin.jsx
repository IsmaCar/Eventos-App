/**
 * Componente de formulario de inicio de sesión (LoginForm)
 * 
 * Este componente gestiona la interfaz y lógica del proceso de autenticación:
 * - Valida y envía credenciales de usuario (email/contraseña)
 * - Gestiona estados de carga y errores durante la autenticación
 * - Provee feedback visual del estado de la autenticación mediante Toast notifications
 * - Redirecciona al usuario a la página principal tras autenticación exitosa
 * - Ofrece enlace a registro para usuarios nuevos
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Spinner from "./Spinner";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();


  const handleChange = (e) => {
    const name = e.target.name;
    setFormData(prev => ({ ...prev, [name]: e.target.value.trim() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser(formData);

      if (response && !response.error) {
        success("¡Inicio de sesión exitoso! Bienvenido de vuelta.");
        navigate("/");
      } else {
        error(response.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      error(err.message || "Error al iniciar sesión, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-md mx-auto my-10 p-5 bg-white rounded-lg shadow-lg">
      <header className="text-2xl font-semibold text-center text-gray-800">
        INICIAR SESIÓN
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <section>
          <label
            htmlFor="email"
            className="block text-xl font-semibold text-gray-900"
          >
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 mt-2 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500" />
        </section>
        <section>
          <label
            htmlFor="password"
            className="block text-xl font-semibold text-gray-900"
          >
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 mt-2 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500" />
        </section>
        <button
          type="submit"
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-gradient-to-r from-fuchsia-400 to-indigo-400 rounded-lg hover:scale-105 transition duration-300"
        >          
        {loading ? (
          <span className="flex items-center justify-center gap-3 w-full">
            <Spinner size="xs" color="white" />
            <span>Iniciando sesión...</span>
          </span>
        ) : (
          'Iniciar Sesión'
        )}
        </button>
      </form>
      <footer className="mt-4 text-center">
        <p className="text-gray-600">
          ¿No tienes una cuenta?{" "}
          <a href="/register" className="text-indigo-500 hover:underline">
            Regístrate aquí
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LoginForm;