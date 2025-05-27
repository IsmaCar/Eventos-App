/**
 * Context de eventos para la aplicación
 * 
 * Proporciona funcionalidades de:
 * - Creación de eventos con imágenes y ubicación
 * - Obtención de lista de eventos
 * - Obtención de eventos individuales por ID
 * - Estados de carga y gestión de errores
 */
import React, { createContext, useContext, useState } from 'react'
import { useAuth } from './AuthContext';
import { getImageUrl, validateImageFile, MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '../utils/Imagehelper';
const API_URL = import.meta.env.VITE_API_URL;

const EventContext = createContext();

/**
 * Proveedor del contexto de eventos
 * Envuelve la aplicación y proporciona funcionalidades de eventos a todos los componentes
 */
export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    /**
     * Crea un nuevo evento en el sistema
     */
    const createEvent = async (eventData) => {
        try {
            if (!token || token === "undefined" || token === "null") {
                console.error("Token no válido:", token);
                throw new Error("No estás autenticado. Por favor, inicia sesión.");
            }

            // Formatear la fecha al formato esperado por el backend (DD/MM/YYYY)
            const date = new Date(eventData.event_date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

            // Crear FormData para envío de archivos y datos
            const formData = new FormData();
            formData.append('title', eventData.title);
            formData.append('description', eventData.description);
            formData.append('event_date', formattedDate);            // Validación y procesamiento de imagen si existe
            if (eventData.image) {
                // Usar la función de validación del ImageHelper
                const validation = validateImageFile(eventData.image);
                
                if (!validation.isValid) {
                    // Lanzar error con todos los mensajes de validación
                    throw new Error(validation.errors.join('. '));
                }
                formData.append('image', eventData.image);
            }


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

                // Intentar parsear respuesta JSON si es posible
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

            // Actualizar la lista local de eventos con el nuevo evento
            setEvents(prev => prev ? [...prev, data.event] : [data.event]);
            return data;

        } catch (error) {
            console.error("Error en createEvent:", error);
            return { error: error.message || "Error al crear el evento" };
        }
    };   
    
    /**
     * Obtiene todos los eventos del usuario autenticado
     * Actualiza el estado de eventos y loading
     */
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/event`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });


            if (!response.ok)
                throw new Error("Error al obtener los eventos");

            const data = await response.json();

            setEvents(data.events);

        } catch (error) {
            throw new Error("Error fetching events: ", error.message);

        } finally {
            setLoading(false);
        }
    }

    /**
     * Obtiene un evento específico por su ID
     */
    const getEventById = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/event/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            return data;        } catch (error) {
            console.error("Error fetching event:", error);
            throw error;
        }
    };

    return (
        <EventContext.Provider value={{
            fetchEvents,
            createEvent,
            getImageUrl, 
            getEventById,
            events,
            loading
        }}>
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