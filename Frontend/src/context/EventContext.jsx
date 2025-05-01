import React from 'react'
const API_URL = import.meta.env.VITE_API_URL;

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState(null);
    const [loading, setLoading] = useState(true);

    const createEvent = async ({title, description, event_date, image}) => {
        try {
            const response = await fetch(`${API_URL}/api/event/create`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({title, description, event_date, image })
            });

            if (!response.ok) 
                throw new Error("Error al obtener eventos");
            
            await response.json();
        
        } catch (error) {
            console.error("Error al obtener eventos", error);
        
        } finally {
            setLoading(false);
        }
    };

    return (
        <EventContext.Provider value={{ createEvent, events, loading }}>
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