/**
 * Componente de formulario para la creación de eventos
 * Proporciona interfaz para:
 * - Ingresar información básica del evento (título, descripción, fecha)
 * - Seleccionar ubicación usando mapas
 * - Subir imagen de portada (con drag & drop)
 * - Validar datos antes de enviarlos al backend
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from './Maps';
import { useEvent } from '../context/EventContext';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';

function FormCreateEvent() {
    const { createEvent } = useEvent();
    const navigate = useNavigate();
    const toast = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_date: "",
        location: "",
        latitude: "",
        longitude: "",
        image: null,
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [descriptionLength, setDescriptionLength] = useState(0);
    const [descriptionError, setDescriptionError] = useState("");
    const [dateError, setDateError] = useState("");

    const MAX_DESCRIPTION_LENGTH = 500;

    // Valida si una fecha es igual o posterior al día de hoy
    const isValidDate = (dateString) => {
        if (!dateString) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear la hora para comparar solo fechas

        const selectedDate = new Date(dateString);
        return selectedDate >= today;
    };

    /**
     * Maneja los cambios en los campos del formulario
     * Aplica validaciones específicas según el campo modificado
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validación para el campo de descripción
        if (name === 'description') {
            if (value.length > MAX_DESCRIPTION_LENGTH) {
                setDescriptionError(`La descripción no puede exceder los ${MAX_DESCRIPTION_LENGTH} caracteres`);
                return;
            }

            setDescriptionLength(value.length);
            setDescriptionError("");
        }

        // Validación para el campo de fecha
        if (name === 'event_date') {
            if (!isValidDate(value)) {
                setDateError("La fecha del evento no puede ser anterior a hoy");
            } else {
                setDateError("");
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Limpieza de errores al desmontar el componente
    useEffect(() => {
        return () => {
            setDescriptionError("");
            setDateError("");
        };
    }, []);

    // Procesar los cambios en la ubicación seleccionada
    const handleLocationChange = (location) => {
        if (!location || !location.address || !location.lat || !location.lng) {
            // Resetear los datos de ubicación si no son válidos
            setFormData(prev => ({
                ...prev, location: null,
                latitude: null,
                longitude: null
            }));
            return;
        };

        // Almacenar los datos de ubicación en el estado
        setFormData(prev => ({
            ...prev, location: location.address,
            latitude: location.lat.toString(),
            longitude: location.lng.toString()
        }));
    }

    /**
     * Procesa la selección de imagen desde input tipo file
     * Valida tipo y tamaño de archivo, genera vista previa
     */
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validación del tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                toast.error("El archivo no es válido. Solo se permiten imágenes JPG o PNG.");
                return;
            }
            // Validación del tamaño máximo
            const maxSize = 1 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error(`La imagen es demasiado grande. El tamaño máximo es 1MB.`);
                return;
            }

            setFormData(prev => ({ ...prev, image: file }));

            // Generar vista previa de la imagen seleccionada
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Maneja el evento cuando el usuario arrastra un archivo sobre el área de carga
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    }


    // Maneja el evento cuando el usuario sale del área de carga con un archivo
    const handleDragLeave = () => {
        setIsDragging(false);
    };

    // Procesa archivos soltados en el área de carga mediante drag & drop
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            // Generar vista previa de la imagen
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }


    // Elimina la imagen seleccionada y su vista previa
    const handleRemoveImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: null }));
    }

    // Previene envío automático del formulario al pulsar Enter en inputs
    const handlePreventSubmit = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validaciones finales antes de enviar al servidor
        if (descriptionLength > MAX_DESCRIPTION_LENGTH) {
            toast.error(`La descripción no puede exceder los ${MAX_DESCRIPTION_LENGTH} caracteres`);
            setLoading(false);
            return;
        }

        if (!isValidDate(formData.event_date)) {
            toast.error("La fecha del evento no puede ser anterior a hoy");
            setLoading(false);
            return;
        }

        try {
            // Enviar datos al servidor mediante el contexto
            const response = await createEvent(formData);
            if (response && !response.error) {
                toast.success("¡Evento creado exitosamente!");
                navigate("/");
                setLoading(false);
            } else {
                toast.error(response.error || 'Error al crear el evento');
                setLoading(false);
                return;
            }
        } catch (error) {
            toast.error("Error al crear el evento. Inténtalo de nuevo.");
            setLoading(false);
            console.error(error);
        }
    };
    return (
        <main className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <header className="text-3xl font-bold text-center mb-8 text-gray-800">Crear Nuevo Evento</header>

            <form onSubmit={handleSubmit} onKeyDown={handlePreventSubmit} className="space-y-6">
                {/* Título del evento */}
                <section>
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
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-300 focus:border-transparent" required
                    />
                </section>

                {/* Descripción */}
                <section>
                    <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-2">
                        Descripción
                        <span className={`ml-2 text-sm ${descriptionLength > MAX_DESCRIPTION_LENGTH - 50
                            ? descriptionLength > MAX_DESCRIPTION_LENGTH
                                ? 'text-red-600'
                                : 'text-amber-600'
                            : 'text-gray-500'}`}>
                            ({descriptionLength}/{MAX_DESCRIPTION_LENGTH})
                        </span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe los detalles de tu evento"
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none
                            ${descriptionError ? 'border-red-500' : 'border-gray-300'}`}
                        required
                        maxLength={MAX_DESCRIPTION_LENGTH}
                    />
                    {descriptionError && (
                        <p className="mt-1 text-red-600 text-sm">{descriptionError}</p>
                    )}
                    <p className={`text-xs mt-1 ${descriptionLength > MAX_DESCRIPTION_LENGTH - 50
                        ? descriptionLength > MAX_DESCRIPTION_LENGTH - 20
                            ? 'text-red-600'
                            : 'text-amber-600'
                        : 'text-gray-500'}`}>
                        {descriptionLength > MAX_DESCRIPTION_LENGTH - 50
                            ? descriptionLength > MAX_DESCRIPTION_LENGTH - 20
                                ? `¡Límite alcanzado! No puedes escribir más de ${MAX_DESCRIPTION_LENGTH} caracteres.`
                                : `Te estás acercando al límite de ${MAX_DESCRIPTION_LENGTH} caracteres.` : `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`}
                    </p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha del evento */}
                    <article>
                        <label htmlFor="event_date" className="block text-lg font-medium text-gray-700 mb-2">
                            Fecha del evento
                        </label>
                        <input
                            type="date"
                            id="event_date"
                            name="event_date"
                            value={formData.event_date}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-300 focus:border-transparent
                                ${dateError ? 'border-red-500' : 'border-gray-300'}`}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                        {dateError && (
                            <p className="mt-1 text-red-600 text-sm">{dateError}</p>
                        )}
                    </article>

                    {/* Ubicación */}
                    <article>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                            Ubicación
                        </label>

                        <LocationPicker onLocationChange={handleLocationChange} />

                        {formData.location && (
                            <p className="text-sm text-gray-600 mt-2">
                                <strong>Dirección seleccionada:</strong> {formData.location}                            </p>
                        )}
                    </article>
                </section>

                {/* Imagen del evento */}
                <section>
                    <label htmlFor="image" className="block text-lg font-medium text-gray-700 mb-2">
                        Imagen de la tarjeta
                    </label>
                    <section className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 rounded-lg transition-colors ${isDragging
                        ? 'border-indigo-500 bg-indigo-50 border-dashed'
                        : 'border-gray-300 border-dashed'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}>
                        <figure className="space-y-1 text-center">
                            {imagePreview ? (
                                <aside className="mb-4">
                                    <img
                                        src={imagePreview}
                                        alt="Vista previa"
                                        className="h-40 w-auto mx-auto rounded-lg object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                                    >
                                        Eliminar imagen
                                    </button>
                                </aside>
                            ) : (
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <address className="flex text-sm text-gray-600">
                                        <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                            <span>Sube una imagen</span>
                                            <input
                                                id="image"
                                                name="image"
                                                type="file"
                                                className="sr-only"
                                                accept="image/jpeg, image/png, image/webp"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                        <p className="pl-1">o arrastra y suelta</p>
                                    </address>
                                    <p className="text-xs text-gray-500">PNG y JPG</p>
                                </>)}
                        </figure>
                    </section>
                </section>
                <nav className="flex justify-end space-x-4 pt-4">
                    {/* Botón para cancelar y volver a la página principal */}
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                        Cancelar
                    </button>
                    {/* Botón para enviar el formulario, deshabilitado durante carga o con errores */}
                    <button
                        type="submit"
                        className={`px-8 py-3 bg-gradient-to-r from-fuchsia-400 to-indigo-400 text-white rounded-lg transition duration-200 flex items-center 
                                ${(dateError || descriptionError) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                        disabled={loading || !!dateError || !!descriptionError}
                    >                        {loading ? (
                        <span className="flex items-center">
                            <Spinner size="xs" color="white" containerClassName="mr-2" />
                            <span>Creando...</span>
                        </span>) : "Crear Evento"}
                    </button>
                </nav>
            </form>
        </main>
    );
}

export default FormCreateEvent;