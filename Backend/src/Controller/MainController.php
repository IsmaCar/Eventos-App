<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class MainController extends AbstractController
{    #[Route('/', name: 'app_main')]
    public function index(): Response
    {
        return $this->render('welcome.html.twig', [
            'app_name' => 'Eventos App',
            'environment' => $this->getParameter('kernel.environment'),
            'api_endpoints' => [
                'Autenticación' => [
                    '/api/register' => 'Registro de usuarios',
                    '/api/auth/login' => 'Autenticacíon de usuarios'
                ],
                'Gestión de eventos' => [
                    '/api/event/create' => 'Crear nuevo evento',
                    '/api/event' => 'Obtener eventos del usuario',
                    '/api/event/{id}' => 'Obtener detalles del evento',
                    '/api/event/delete/{id}' => 'Eliminar evento (solo creador)',
                    '/api/events/{id}/photos' => 'Ver/subir fotos del evento',
                    '/api/events/{id}/attendees' => 'Ver asistentes del evento',
                    '/api/events/{id}/cancel-attendance' => 'Cancelar asistencia del evento',
                    '/api/events/{id}/remove-attendee/{attendeeId}' => 'Borrar asistente (solo organizador)'
                ],
                'Gestión de usuarios' => [
                    '/api/user/stats' => 'Estadísticas del usuario',
                    '/api/user/event/' => 'Eventos del usuario autenticado',
                    '/api/public/user/{id}' => 'Perfil público de usuario',
                    '/api/public/user/{id}/events' => 'Eventos públicos del usuario',
                    '/api/users/upload-avatar' => 'Actualizar avatar de usuario',
                    '/api/users/update' => 'Actualizar información de usuario',
                    '/api/tools/users/search' => 'Buscar usuarios'
                ],
                'Gestión de amistades' => [
                    '/api/friends' => 'Lista de amigos',
                    '/api/friends/requests/received' => 'Solicitudes recibidas',
                    '/api/friends/sent-requests' => 'Solicitudes enviadas',
                    '/api/friends/request/{id}' => 'Enviar solicitud de amistad',
                    '/api/friends/accept/{id}' => 'Acpetar solicitud de amistad',
                    '/api/friends/reject/{id}' => 'Rechazar solicitud de amistad',
                    '/api/friends/{id}' => 'Borrar amigo',
                    '/api/friends/check/{id}' => 'Verificar estado de amistad',
                    '/api/friends/search' => 'Buscar amigos',
                    '/api/friends/user/{id}' => 'Amigos de un usuario'
                ],
                'Gestión invitaciones a eventos' => [
                    '/api/events/{id}/invite' => 'Enviar invitación a evento',
                    '/api/invitations/{id}/respond' => 'Responder a invitación',
                    '/api/invitations' => 'Invitaciones del usuario',
                    '/api/events/{id}/invitations' => 'Invitaciones del evento',
                    '/api/invitations/verify/{token}' => 'Verificar token de invitación',
                    '/api/invitations/user/received' => 'Invitaciones recibidas'
                ],
                'Gestión fotos' => [
                    '/api/photos/{id}/favorite' => 'Marcar foto favorita',
                    '/api/photos/{id}/is-favorite' => 'Verificar si es favorita',
                    '/api/user/favorite-photos' => 'Fotos favoritas del usuario',
                    '/api/photos/{id}/download' => 'Descargar foto'
                ],
                'Administración' => [
                    '/api/admin/stats' => 'Estadísticas de administrador',
                    '/api/admin/manage' => 'Panel de gestión',
                    '/api/admin/user/{id}/toggle-status' => 'Banear/Desbanear usuario',
                    '/api/admin/event/{id}/toggle-status' => 'Banear/Desbanear evento',
                ]
            ]
        ]);
    }
}
