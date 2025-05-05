import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';

// Configuración del mapa
const apiKey = import.meta.env.VITE_API_MAPS;
const mapContainerStyle = {
    width: '100%',
    height: '300px'
};
const center = { lat: 40.416775, lng: -3.70379 }; // Madrid como centro predeterminado

const LocationPicker = ({ onLocationChange }) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: ['places'],
    });

    const [tempMarker, setTempMarker] = useState(null);
    const [tempAddress, setTempAddress] = useState('');
    const autocompleteRef = useRef(null);
    
    // Usamos useRef para rastrear si ya enviamos esta ubicación
    // Esto evitará el bucle infinito
    const previousLocationRef = useRef({ lat: null, lng: null, address: '' });

    // Efecto para actualizar la ubicación solo cuando realmente cambia
    useEffect(() => {
        if (tempMarker && tempAddress) {
            // Verificar si la ubicación realmente cambió antes de notificar
            const currentLocation = {
                lat: tempMarker.lat,
                lng: tempMarker.lng,
                address: tempAddress
            };
            
            const prevLoc = previousLocationRef.current;
            
            // Solo notificar si la ubicación cambió significativamente
            if (prevLoc.lat !== currentLocation.lat || 
                prevLoc.lng !== currentLocation.lng || 
                prevLoc.address !== currentLocation.address) {
                
                // Actualizar la referencia con la ubicación actual
                previousLocationRef.current = { ...currentLocation };
                
                // Notificar el cambio
                onLocationChange(currentLocation);
            }
        }
    }, [tempMarker, tempAddress, onLocationChange]);

    const handlePlaceChanged = () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.geometry) {
            const location = place.geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const formattedAddress = place.formatted_address;

            // Actualizar el marcador y la dirección
            setTempMarker({ lat, lng });
            setTempAddress(formattedAddress);
        }
    };

    const handleMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };

        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const formattedAddress = results[0].formatted_address;
                // Actualizar el marcador y la dirección
                setTempMarker({ lat, lng });
                setTempAddress(formattedAddress);
            }
        });
    };

    const handleClearLocation = (e) => {
        // Importante: evitar que se envíe el formulario
        e.preventDefault();
        
        setTempMarker(null);
        setTempAddress('');
        
        // Reiniciar la referencia previa
        previousLocationRef.current = { lat: null, lng: null, address: '' };
        
        // Notificar que no hay ubicación
        onLocationChange(null);
    };

    if (loadError) return <p>Error cargando mapa</p>;
    if (!isLoaded) return <p>Cargando mapa...</p>;

    return (
        <div className="space-y-2">
            <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
                <input
                    type="text"
                    placeholder="Busca una dirección"
                    className="w-full p-2 border rounded"
                />
            </Autocomplete>

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={tempMarker || center}
                zoom={tempMarker ? 15 : 10}
                onClick={handleMapClick}
            >
                {tempMarker && <Marker position={tempMarker} />}
            </GoogleMap>
            
            {tempAddress && (
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-green-600">
                        Ubicación: {tempAddress}
                    </p>
                    <button 
                        onClick={handleClearLocation}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                        Borrar ubicación
                    </button>
                </div>
            )}
        </div>
    );
};

// Exportación predeterminada para usar con "import LocationPicker from './Maps'"
export default LocationPicker;

// Exportación nombrada para usar con "import { LocationPicker } from './Maps'"
export { LocationPicker };