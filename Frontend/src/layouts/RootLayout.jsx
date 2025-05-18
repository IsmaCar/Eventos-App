import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
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
      <Navbar/>
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