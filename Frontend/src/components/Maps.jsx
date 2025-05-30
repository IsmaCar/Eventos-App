import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, Autocomplete } from '@react-google-maps/api';

// Configuración del mapa
const apiKey = import.meta.env.VITE_API_MAPS;
const mapContainerStyle = {
    width: '100%',
    height: '300px'
};
const center = { lat: 40.416775, lng: -3.70379 }; // Madrid como centro predeterminado

// Añade parámetros readOnly e initialLocation
const LocationPicker = ({ onLocationChange, readOnly = false, initialLocation = null }) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: ['places'],
    });

    // Usar initialLocation si se proporciona y estamos en modo readOnly
    const [tempMarker, setTempMarker] = useState(
        readOnly && initialLocation ?
            { lat: initialLocation.lat, lng: initialLocation.lng } :
            null
    );
    const [tempAddress, setTempAddress] = useState(
        readOnly && initialLocation ? initialLocation.address : ''
    );
    const autocompleteRef = useRef(null);

    const previousLocationRef = useRef({ lat: null, lng: null, address: '' });


    useEffect(() => {
        // Solo notificar cambios si no estamos en modo readOnly
        if (!readOnly && tempMarker && tempAddress) {
            // Resto del código igual...
            const currentLocation = {
                lat: tempMarker.lat,
                lng: tempMarker.lng,
                address: tempAddress
            };

            const prevLoc = previousLocationRef.current;

            if (prevLoc.lat !== currentLocation.lat ||
                prevLoc.lng !== currentLocation.lng ||
                prevLoc.address !== currentLocation.address) {

                previousLocationRef.current = { ...currentLocation };

                // Solo llamar a onLocationChange si existe y no estamos en modo readOnly
                if (onLocationChange) {
                    onLocationChange(currentLocation);
                }
            }
        }
    }, [tempMarker, tempAddress, onLocationChange, readOnly]);

    const handlePlaceChanged = () => {
        // Solo permitir cambios si no estamos en modo readOnly
        if (readOnly) return;

        const place = autocompleteRef.current.getPlace();
        if (place && place.geometry) {
            const location = place.geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            const formattedAddress = place.formatted_address;

            setTempMarker({ lat, lng });
            setTempAddress(formattedAddress);
        }
    };

    const handleMapClick = (e) => {
        // Solo permitir cambios si no estamos en modo readOnly
        if (readOnly) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };

        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const formattedAddress = results[0].formatted_address;
                setTempMarker({ lat, lng });
                setTempAddress(formattedAddress);
            }
        });
    };

    const handleClearLocation = (e) => {
        // Solo permitir cambios si no estamos en modo readOnly
        if (readOnly) return;

        e.preventDefault();

        setTempMarker(null);
        setTempAddress('');

        previousLocationRef.current = { lat: null, lng: null, address: '' };

        if (onLocationChange) {
            onLocationChange(null);
        }
    };

    if (loadError) return <p>Error cargando mapa</p>;
    if (!isLoaded) return <p>Cargando mapa...</p>;

    // Definir opciones del mapa para modo readOnly
    const mapOptions = readOnly ? {
        disableDefaultUI: false,   
        zoomControl: true,      
        scrollwheel: true,        
        draggable: true,         
        fullscreenControl: true, 
        mapTypeControl: false,    
        streetViewControl: false  
    } : {};

    return (
        <div className="space-y-2">
            {/* Solo mostrar el campo de búsqueda si no estamos en modo readOnly */}
            {!readOnly && (
                <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
                    <input
                        type="text"
                        placeholder="Busca una dirección"
                        className="w-full p-2 border rounded"
                    />
                </Autocomplete>
            )}

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={tempMarker || center}
                zoom={tempMarker ? 15 : 10}
                onClick={readOnly ? undefined : handleMapClick}
                options={mapOptions}
            >
                {tempMarker && <Marker position={tempMarker} />}
            </GoogleMap>

            {/* Solo mostrar los controles si no estamos en modo readOnly */}
            {tempAddress && !readOnly && (
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

            {/* Mostrar solo la dirección en modo readOnly */}
            {readOnly && tempAddress && (
                <p className="text-sm text-gray-600 mt-1">
                    {tempAddress}
                </p>
            )}
        </div>
    );
};

export default LocationPicker;
export { LocationPicker };