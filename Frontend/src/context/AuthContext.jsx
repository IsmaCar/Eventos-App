/**
 * Context de autenticación para la aplicación de eventos
 * 
 * Proporciona funcionalidades de:
 * - Registro de usuarios
 * - Inicio de sesión
 * - Manejo de tokens JWT
 * - Gestión de roles (admin/usuario)
 * - Persistencia de sesión
 */
import { createContext, useContext, useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext();

/**
 * Proveedor del contexto de autenticación
 * Envuelve la aplicación y proporciona funcionalidades de auth a todos los componentes
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);         
  const [token, setToken] = useState(sessionStorage.getItem("token")); 
  const [isAdmin, setIsAdmin] = useState(false);   
 
  /**
   * Verifica si un usuario tiene rol de administrador
   */
  const checkAdminRole = (userData) => {
    return userData &&
      userData.roles &&
      userData.roles.includes('ROLE_ADMIN');
  };

  /**
   * Efecto para restaurar la sesión del usuario al cargar la aplicación
   * Lee los datos del sessionStorage y restaura el estado si existe una sesión válida
   */
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      setIsAdmin(
        parsedUser &&
        parsedUser.roles &&
        parsedUser.roles.includes('ROLE_ADMIN')
      )
    }
  }, []);

  /**
   * Registra un nuevo usuario en el sistema
   */  
  const registerUser = async ({ username, email, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Error al registrarse',
          status: response.status
        };
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inicia sesión de un usuario existente
   */
  const loginUser = async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Error al iniciar sesión'
        };
      }

      setUser(data.user);
      setToken(data.token);
      
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      const adminStatus = checkAdminRole(data.user);
      setIsAdmin(adminStatus);

      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Actualiza la información del usuario actual
   */

  const updateUser = (userData) => {

    if (typeof userData === 'object' && userData !== null) {
      // Combinar datos existentes con los nuevos datos
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    }
    return user;
  };

  /**
   * Cierra la sesión del usuario actual
   * Limpia todos los estados y remueve datos del sessionStorage
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      registerUser, 
      loginUser, 
      updateUser, 
      logout, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe estar dentro del proveedor AuthProvider");
  }
  return context;
};