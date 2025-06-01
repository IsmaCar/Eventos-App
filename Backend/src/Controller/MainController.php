<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class MainController extends AbstractController
{    #[Route('/', name: 'app_main')]
    public function index(): Response
    {        return $this->render('welcome.html.twig', [
            'app_name' => 'Eventos App',
            'environment' => $this->getParameter('kernel.environment'),            
            'api_endpoints' => [
                'Autenticación' => [
                    'POST /api/register' => 'Registro de usuarios',
                    'POST /api/login' => 'Autenticación de usuarios'
                ],
                'Gestión de eventos' => [
                    'POST /api/event/create' => 'Crear nuevo evento',
                    'GET /api/event' => 'Obtener eventos del usuario',
                    'GET /api/event/{id}' => 'Obtener detalles del evento',
                    'DELETE /api/event/delete/{id}' => 'Eliminar evento (solo creador)',
                    'GET /api/events/{id}/photos' => 'Ver fotos del evento',
                    'POST /api/events/{id}/photos' => 'Subir foto a evento',
                    'GET /api/events/{id}/attendees' => 'Ver asistentes del evento',
                    'POST /api/events/{id}/cancel-attendance' => 'Cancelar asistencia del evento',
                    'DELETE /api/events/{id}/remove-attendee/{attendeeId}' => 'Borrar asistente (solo organizador)'
                ],
                'Gestión de usuarios' => [
                    'GET /api/user/stats' => 'Estadísticas del usuario',
                    'GET /api/user/event/' => 'Eventos del usuario autenticado',
                    'GET /api/public/user/{id}' => 'Perfil público de usuario',
                    'GET /api/public/user/{id}/events' => 'Eventos públicos del usuario',
                    'POST /api/users/upload-avatar' => 'Actualizar avatar de usuario',
                    'PUT /api/users/update' => 'Actualizar información de usuario',
                    'GET /api/tools/users/search' => 'Buscar usuarios'
                ],
                'Gestión de amistades' => [
                    'GET /api/friends' => 'Lista de amigos',
                    'GET /api/friends/requests/received' => 'Solicitudes recibidas',
                    'GET /api/friends/sent-requests' => 'Solicitudes enviadas',
                    'POST /api/friends/request/{id}' => 'Enviar solicitud de amistad',
                    'POST /api/friends/accept/{id}' => 'Aceptar solicitud de amistad',
                    'POST /api/friends/reject/{id}' => 'Rechazar solicitud de amistad',
                    'DELETE /api/friends/{id}' => 'Borrar amigo',
                    'GET /api/friends/check/{id}' => 'Verificar estado de amistad',
                    'GET /api/friends/search' => 'Buscar amigos',
                    'GET /api/friends/user/{id}' => 'Amigos de un usuario'
                ],
                'Gestión invitaciones a eventos' => [
                    'POST /api/events/{id}/invite' => 'Enviar invitación a evento',
                    'POST /api/invitations/{id}/respond' => 'Responder a invitación',
                    'GET /api/invitations' => 'Invitaciones del usuario',
                    'GET /api/events/{id}/invitations' => 'Invitaciones del evento',
                    'GET /api/invitations/verify/{token}' => 'Verificar token de invitación',
                    'GET /api/invitations/user/received' => 'Invitaciones recibidas'
                ],
                'Gestión fotos' => [
                    'POST /api/photos/{id}/favorite' => 'Marcar/desmarcar foto favorita',
                    'GET /api/photos/{id}/favorite' => 'Verificar si foto es favorita',
                    'GET /api/photos/{id}/is-favorite' => 'Verificar estado de favorito',
                    'GET /api/user/favorite-photos' => 'Fotos favoritas del usuario',
                    'GET /api/photos/{id}/download' => 'Descargar foto'
                ],
                'Administración' => [
                    'GET /api/admin/stats' => 'Estadísticas de administrador',
                    'GET /api/admin/manage' => 'Panel de gestión de usuarios y eventos',
                    'PUT /api/admin/user/{id}/toggle-status' => 'Banear/Desbanear usuario',
                    'PUT /api/admin/event/{id}/toggle-status' => 'Banear/Desbanear evento'
                ]
            ]
        ]);
    }
}
