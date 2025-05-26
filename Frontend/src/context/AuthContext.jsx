import { createContext, useContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = (userData) => {
    return userData &&
      userData.roles &&
      userData.roles.includes('ROLE_ADMIN');
  };

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
  const registerUser = async ({ username, email, password }) => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json();

      if (!response.ok) {
        // Devolver el error específico del backend para que el frontend pueda manejarlo
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
        // Cuando el usuario está baneado (código 403), el backend devuelve error y message
        return {
          error: data.message || data.error || 'Error al iniciar sesión'
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


  const updateUser = (userData) => {
    // Si se pasa un objeto, actualiza todo el usuario
    if (typeof userData === 'object' && userData !== null) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Actualizar el localStorage
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    }
    return user;
  };


  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, registerUser, loginUser, updateUser, logout, isAdmin }}>
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