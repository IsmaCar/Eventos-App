import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FormCreateEvent() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_date: "",
        location: "",
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData, [name]: value });
    };
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({...formData, image: file });
            
            // Crear preview de la imagen
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            // Aquí iría la lógica para enviar los datos al backend
            console.log("Datos del evento:", formData);
            
            // Simular envío exitoso (reemplazar con llamada real a API)
            setTimeout(() => {
                setLoading(false);
                navigate("/"); // Redireccionar a la página de eventos
            }, 1500);
            
        } catch (err) {
            setError("Error al crear el evento. Inténtalo de nuevo.");
            setLoading(false);
            console.error(err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Crear Nuevo Evento</h2>
            
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título del evento */}
                <div>
                    <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-2">
                        Título del evento
                    </label>
                    <input 
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ej: Fiesta de cumpleaños"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                        required
                    />
                </div>
                
                {/* Descripción */}
                <div>
                    <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-2">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe los detalles de tu evento"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none"
                        required
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha del evento */}
                    <div>
                        <label htmlFor="event_date" className="block text-lg font-medium text-gray-700 mb-2">
                            Fecha del evento
                        </label>
                        <input 
                            type="date"
                            id="event_date"
                            name="event_date"
                            value={formData.event_date}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    {/* Ubicación */}
                    <div>
                        <label htmlFor="location" className="block text-lg font-medium text-gray-700 mb-2">
                            Ubicación
                        </label>
                        <input 
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Dirección del evento"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                            required
                        />
                    </div>
                </div>
                
                {/* Imagen del evento */}
                <div>
                    <label htmlFor="image" className="block text-lg font-medium text-gray-700 mb-2">
                        Imagen de la tarjeta
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                            {imagePreview ? (
                                <div className="mb-4">
                                    <img 
                                        src={imagePreview} 
                                        alt="Vista previa" 
                                        className="h-40 w-auto mx-auto rounded-lg object-cover"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setImagePreview(null);
                                            setFormData({...formData, image: null});
                                        }}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                        Eliminar imagen
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                            <span>Sube una imagen</span>
                                            <input 
                                                id="image" 
                                                name="image" 
                                                type="file" 
                                                className="sr-only"
                                                accept="image/jpeg, image/png"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                        <p className="pl-1">o arrastra y suelta</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button 
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white rounded-lg hover:scale-105 transition duration-200 flex items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creando...
                            </>
                        ) : "Crear Evento"}
                    </button>
                </div>
            </form>
        </div>    
    );
}

export default FormCreateEvent;