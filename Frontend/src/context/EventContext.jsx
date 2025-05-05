import React, { createContext, useContext, useState } from 'react'
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth(); 
    
    
    const createEvent = async (eventData) => {
        try {
            if (!token || token === "undefined" || token === "null") {
                console.error("Token no válido:", token);
                throw new Error("No estás autenticado. Por favor, inicia sesión.");
            }
    
            const date = new Date(eventData.event_date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
            const formData = new FormData();
            formData.append('title', eventData.title);
            formData.append('description', eventData.description);
            formData.append('event_date', formattedDate);
    
            // Validación y añadido de imagen si existe
            if (eventData.image) {
                if (!(eventData.image instanceof File)) {
                    throw new Error("El archivo de imagen no es válido.");
                }
    
                // Validar que la imagen no esté vacía (0 bytes)
                if (eventData.image.size === 0) {
                    throw new Error("La imagen está vacía o corrupta. Selecciona otra imagen.");
                }
    
                // Validar el tipo de archivo
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(eventData.image.type)) {
                    throw new Error("Formato de imagen no permitido. Por favor, usa JPG, PNG, GIF o WEBP.");
                }
    
                // Validar el tamaño (máximo 8MB)
                const maxSize = 8 * 1024 * 1024;
                if (eventData.image.size > maxSize) {
                    throw new Error(`La imagen es demasiado grande. El tamaño máximo es 5MB. Tamaño actual: ${(eventData.image.size / (1024 * 1024)).toFixed(2)}MB`);
                }
    
                // Si pasa las validaciones, añadir al FormData
                formData.append('image', eventData.image);
            }
    
            // Añadir información de ubicación si existe
            if (eventData.location) formData.append('address', eventData.location);
            if (eventData.latitude) formData.append('latitude', eventData.latitude);
            if (eventData.longitude) formData.append('longitude', eventData.longitude);
    
    
            const response = await fetch(`${API_URL}/api/event/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
    
            if (!response.ok) {
                const contentType = response.headers.get('Content-Type');
                let errorMessage = "Error al crear el evento";
    
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } else {
                    const text = await response.text();
                    console.error("Respuesta no JSON:", text);
                    errorMessage = text;
                }
    
                throw new Error(errorMessage);
            }
    
            const data = await response.json();
            console.log("Evento creado correctamente:", data);
    
            // Actualizar la lista de eventos con el nuevo evento
            setEvents(prev => prev ? [...prev, data.event] : [data.event]);
            return data;
    
        } catch (error) {
            console.error("Error en createEvent:", error);
            return { error: error.message || "Error al crear el evento" };
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try{
            const response = await fetch(`${API_URL}/api/event`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
            }
        })
            if(!response.ok)
                throw new Error("Error al obtener los eventos")

            const data = await response.json()
            setEvents(data.events)
            
        } catch (error) {
         throw new Error("Error fetching events: ", error.message);
            
        } finally {
            setLoading(false)
        }
    }

    return (
        <EventContext.Provider value={{ fetchEvents, createEvent, events, loading,}}>
            {children}
        </EventContext.Provider>
    );
}

export const useEvent = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error("useEvent debe ser usado dentro de un EventProvider");
    }
    return context;
}