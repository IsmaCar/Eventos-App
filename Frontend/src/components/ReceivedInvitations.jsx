// ReceivedInvitations.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const ReceivedInvitations = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { token } = useAuth();

    // Función para limpiar mensajes después de un tiempo
    const clearMessages = () => {
        setTimeout(() => {
            setError('');
            setSuccessMessage('');
        }, 5000);
    };

    useEffect(() => {
        fetchInvitations();
    }, [token]); // Añadido token como dependencia

    const fetchInvitations = async () => {
        try {
            setLoading(true);
            setError(''); // Limpiar errores anteriores

            const response = await axios.get(`${API_URL}/api/invitations/user/received`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Invitaciones recibidas:', response.data);
            setInvitations(response.data.invitations || []);
        } catch (error) {
            console.error('Error al obtener invitaciones:', error);
            console.error('Detalles del error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: error.config
        });
        setError('No se pudieron cargar las invitaciones');
            setError('No se pudieron cargar las invitaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (invitationId, responseType) => {
        try {
            setSuccessMessage(''); // Limpiar mensajes anteriores
            setError('');

            await axios.post(
                `/api/invitations/${invitationId}/respond`,
                { response: responseType },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            fetchInvitations();

            setSuccessMessage(
                responseType === 'accept'
                    ? 'Invitación aceptada correctamente'
                    : 'Invitación rechazada'
            );

            clearMessages(); // Limpiar después de 5 segundos
        } catch (error) {
            console.error('Error al responder a la invitación:', error);
            setError('Error al procesar tu respuesta');
            clearMessages(); // Limpiar después de 5 segundos
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            pending: 'Pendiente',
            accepted: 'Aceptada',
            rejected: 'Rechazada'
        };
        return statusMap[status] || 'Desconocido';
    };

    const getStatusColor = (status) => {
        const colorMap = {
            pending: 'text-yellow-600',
            accepted: 'text-green-600',
            rejected: 'text-red-600'
        };
        return colorMap[status] || '';
    };

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    <p>Cargando invitaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Invitaciones recibidas</h3>

            {/* Mensajes de error y éxito */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    {successMessage}
                </div>
            )}

            {invitations.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No tienes invitaciones pendientes</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {invitations.map(invitation => (
                        <li key={invitation.id} className="py-4">
                            <div className="flex justify-between">
                                <div>
                                    <h4 className="font-medium">{invitation.event.title}</h4>
                                    <p className="text-sm text-gray-500">
                                        Invitado por: {invitation.invitedBy?.username || 'Desconocido'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Estado: <span className={`font-medium ${getStatusColor(invitation.status)}`}>
                                            {getStatusText(invitation.status)}
                                        </span>
                                    </p>
                                </div>

                                {invitation.status === 'pending' && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleRespond(invitation.id, 'accept')}
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            Aceptar
                                        </button>
                                        <button
                                            onClick={() => handleRespond(invitation.id, 'reject')}
                                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ReceivedInvitations;