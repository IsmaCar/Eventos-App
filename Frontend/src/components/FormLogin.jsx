import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState('')
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const nombre = e.target.name;
    setFormData(prev => ({ ...prev, [nombre]: e.target.value.trim() }));
  };
  // voy a realizar un petición a la api con los datos del formulario para verificar
  // si el usuario existe en la base de datos
  const handleSubmit = async (e) => {
    setError('')
    e.preventDefault();
    try {
      // aquí hacemos un login.
      const response = await loginUser(formData);
      // redirigir a la página de productos si hay éxito
      if (response && !response.error) {
        navigate("/");
      } else {
        setError(response.error || 'Error al iniciar sesión')
      }
    } catch (error) {
      console.log("Error al iniciar sesión", error);
      setError(error.message || "Error al iniciar sesión, intenta de nuevo");
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 p-5 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800">
        INICIAR SESIÓN
      </h2>

      {/* Mostrar mensaje de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
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
            className="w-full px-4 py-2 mt-2 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-xl font-semibold text-gray-900"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 mt-2 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-gradient-to-r from-fuchsia-400 to-indigo-400 rounded-lg hover:scale-105 transition duration-300"
        >
          Iniciar Sesión
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          ¿No tienes una cuenta?{" "}
          <a href="/register" className="text-indigo-500 hover:underline">
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;