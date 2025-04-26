import React from "react";
import { Link, Outlet } from "react-router-dom";
const RootLayout = () => {
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
                     className=" max-w-17"/>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow mb-6">
        <Outlet />
      </main>
      <footer className="bg-zinc-600 text-white mx-w-7xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center">
            Invitaciones &copy; 2025 - Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;