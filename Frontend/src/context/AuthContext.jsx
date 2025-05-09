import { createContext, useContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const registerUser = async ({ username, email, password })=> {
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, email, password })
        })

        if(!response.ok)
            throw new Error("Error al registrarse");
        
         return await response.json();
        
        
    } catch (error) {
        console.log('Error al registrarse');
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


      if (!response.ok)
        throw new Error("Usuario o contraseña incorrectos");
      
      
      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data; 
    } catch (error) {
      console.log("Error al iniciar sesión", error);
      throw error;
    }
  };

  // Función para actualizar el usuario
   // Función mejorada para actualizar el usuario
   const updateUser = (userData) => {
    // Si se pasa un objeto, actualiza todo el usuario
    if (typeof userData === 'object' && userData !== null) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Actualizar el localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    }
    return user;
  };


  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, registerUser,loginUser, updateUser, logout }}>
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