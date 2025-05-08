import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

const RootLayout = () => {
  //token inicio de sesion
  const { user, token, logout } = useAuth();
  const avatarUrl = user?.avatarUrl;
  const fullAvatarUrl = avatarUrl ? 
    (avatarUrl.startsWith('http') ? avatarUrl : `${API_URL}${avatarUrl}`) : 
    `${API_URL}/uploads/avatars/default-avatar.png`;
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/"); 
  }

  return (
    <div className="flex flex-col min-h-screen ">
      {/* barra de navegación  */}
      <nav className="bg-zinc-800 text-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4 ">
          <div className="flex justify-start h-16">
            {/* Logo del aplicación web */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold ">
                <img src="../public/images/logo.png" alt="logo web" 
                     className=" max-w-17 h-10"/>
              </Link>
            </div>
            {/* Enlaces de navegación */}
            {token ? (
              <div className="flex items-center ml-auto space-x-4">
              <Link to="/profile" 
              className="flex flex-row items-center  text-white px-4 py-2 
                         rounded-full hover:scale-103 transition duration-300 ease-in-out">
              {/* Avatar - Ahora está explícitamente configurado en fila */}
              <div className="w-7 h-7 rounded-full overflow-hidden mr-2 border-2 border-white flex-shrink-0">
                  <img 
                    src={fullAvatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `${API_URL}/uploads/avatars/default-avatar.png`;
                    }}
                  />
                </div>
                <span>Perfil</span>
              </Link>
                <button onClick={handleLogout} className="bg-red-500 text-black px-4 py-2 
                                                          rounded-xl hover:scale-103 transition duration-300 ease-in-out">
                  Cerrar sesión
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