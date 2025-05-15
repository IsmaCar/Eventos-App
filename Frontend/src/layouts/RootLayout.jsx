import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

const RootLayout = () => {
  //token inicio de sesion
  const { user, token, logout, isAdmin } = useAuth();
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  }

  const avatarUrl = user?.avatar
    ? `${API_URL}/uploads/avatars/${user?.avatar}?v=${avatarKey}`
    : `${API_URL}/uploads/avatars/default-avatar.png`;

  // Forzar la actualización del avatar
  useEffect(() => {
    setAvatarKey(Date.now());
  }, [user]);

   return (
    <div className="flex flex-col min-h-screen">
      {/* barra de navegación  */}
      <nav className="bg-zinc-800 text-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-start h-16">
            {/* Logo del aplicación web y botón de administración */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold">
                <img src="../public/images/logo.png" alt="logo web"
                  className="max-w-17 h-10" />
              </Link>
              
              {/* Botón de administración justo después del logo */}
              {token && isAdmin && (
                <Link to="/dashboard"
                  className="ml-4 bg-indigo-600 text-white px-3 py-1.5 
                            rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="ml-1">Administrar</span>
                </Link>
              )}
            </div>
            
            {/* Enlaces de navegación (ahora incluye fotos favoritas) */}
            {token ? (
              <div className="flex items-center ml-auto space-x-2">
                {/* Nuevo enlace a fotos favoritas */}
                <Link to="/favorite-photos"
                  className="flex flex-row items-center text-white px-3 py-1.5 
                         rounded-lg hover:bg-zinc-700 transition duration-300 ease-in-out">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Fotos favoritas</span>
                </Link>
                
                <Link to="/profile"
                  className="flex flex-row items-center text-white px-2 py-1.5 
                         rounded-full hover:scale-103 transition duration-300 ease-in-out">
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-1 border border-white flex-shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                      }}
                    />
                  </div>
                  <span className="text-sm">Perfil</span>
                </Link>
                
                <button onClick={handleLogout} className="bg-red-500 text-black px-2 py-1.5 
                                                      text-sm rounded-lg hover:scale-103 transition duration-300 ease-in-out">
                  Cerrar Sesión
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
      <main className="flex-grow mb-6">
        <Outlet />
      </main>
      <footer className="bg-zinc-600 text-white mx-w-7xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center">
            Eventos &copy; 2025 - Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;