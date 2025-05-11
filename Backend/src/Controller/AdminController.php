<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Constraints\Regex;

#[Route('/api/admin')]
#[IsGranted('ROLE_ADMIN')]
final class AdminController extends AbstractController
{
    #[Route('/admin', name: 'app_admin')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/AdminController.php',
        ]);
    }

    #[Route('/stats', name: 'app_admin_stats', methods: ['GET'])]
public function adminStats(UserRepository $userRepository,
                           EventRepository $eventRepository): JsonResponse
{
    try {
        // Estadísticas de usuarios
        $users = $userRepository->findAll();
        $userCount = count($users);
        
        // Usuarios registrados en los últimos 7 días
        // $newUsers = $userRepository->countUsersRegisteredSince(new \DateTime('-7 days'));
        
        // Estadísticas de eventos
        $events = $eventRepository->findAll();
        $eventsCount = count($events);
        
        // Eventos futuros
        // $futureEvents = $eventRepository->countFutureEvents();
        
        // Eventos creados en los últimos 7 días
        // $newEvents = $eventRepository->countEventsCreatedSince(new \DateTime('-7 days'));
        
        // Estadísticas de fotos/imágenes
        $photoCount = 0; // Implementar cuando tengas repositorio de fotos
        
        return $this->json([
            'users' => [
                'total' => $userCount,
                // 'newUsers' => $newUsers,
            ],
            'events' => [
                'total' => $eventsCount,
                // 'upcoming' => $futureEvents,
                // 'newEvents' => $newEvents
            ],
            'photos' => [
                'total' => $photoCount
            ],
            'success' => true,
            'message' => 'Estadísticas obtenidas correctamente'
        ]);
        
    } catch (\Exception $e) {
        return $this->json([
            'success' => false,
            'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
        ], 500);
    }
}


    #[Route('/manage', name: 'app_admin_users', methods: ['GET'])]
public function manage(
    Request $request,
    UserRepository $userRepository, 
    EventRepository $eventRepository
): JsonResponse
{
    // Parámetros de paginación
    $page = max(1, (int) $request->query->get('page', 1));
    $limit = max(1, min(50, (int) $request->query->get('limit', 10))); // Entre 1 y 50 elementos
    $offset = ($page - 1) * $limit;
    
    // Determinar qué tipo de datos se están solicitando (usuarios o eventos)
    $type = $request->query->get('type', 'all'); // Por defecto, devuelve todos
    
    // Contar total de registros (para calcular páginas)
    $totalUsers = $userRepository->count([]);
    $totalEvents = $eventRepository->count([]);
    
    // Preparar arrays vacíos
    $userData = [];
    $eventData = [];
    
    // Si se solicitan usuarios o todos
    if ($type === 'users' || $type === 'all') {
        // Obtener usuarios paginados
        $users = $userRepository->findBy([], ['id' => 'DESC'], $limit, $offset);
        
        foreach ($users as $user) {
            $userData[] = [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'avatar' => $user->getAvatar(),
                'banned' => $user->isBanned(),
            ];
        }
    }
    
    // Si se solicitan eventos o todos
    if ($type === 'events' || $type === 'all') {
        // Obtener eventos paginados
        $events = $eventRepository->findBy([], ['id' => 'DESC'], $limit, $offset);
        
        foreach ($events as $event) {
            $creator = $event->getUser();
            
            $eventData[] = [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'description' => $event->getDescription(),
                'event_date' => $event->getEventDate()->format('Y-m-d'),
                'banned' => $event->isBanned(),
                'user' => $creator ? [
                    'id' => $creator->getId(),
                    'username' => $creator->getUsername(),
                ] : null
            ];
        }
    }
    
    // Calcular total de páginas
    $totalUserPages = ceil($totalUsers / $limit);
    $totalEventPages = ceil($totalEvents / $limit);
    
    return $this->json([
        'users' => $userData,
        'events' => $eventData,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'totalItems' => [
                'users' => $totalUsers,
                'events' => $totalEvents
            ],
            'totalPages' => [
                'users' => $totalUserPages,
                'events' => $totalEventPages
            ]
        ],
        'message' => 'Data retrieved successfully',
    ]);
}

    #[Route('/user/{id}/toggle-status', name: 'app_admin_user_toggle_status', methods: ['PUT'])]
    public function toggleUserStatus(
        Request $request,
        EntityManagerInterface $entityManager,
        int $id,
    ): JsonResponse {
   try {
        // Encontrar el usuario por ID
        $user = $entityManager->getRepository(User::class)->find($id);
        
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        
        // Obtener datos de la petición y aplicar el nuevo estado
        $data = json_decode($request->getContent(), true);
        
        // Si es true, el usuario debe estar bloqueado
        // Si es false, el usuario debe estar activo (no bloqueado)
        $shouldBeBanned = $data['banned'] ?? false;
        
        // Actualizar el estado del usuario
        $user->setBanned($shouldBeBanned);
        $entityManager->flush();
        
        return $this->json([
            'success' => true,
            'message' => $shouldBeBanned ? 'Usuario bloqueado correctamente' : 'Usuario desbloqueado correctamente',
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'banned' => $user->isBanned() // Esto debería devolver true si está bloqueado
            ]
        ]);
    } catch (\Exception $e) {
        return $this->json([
            'success' => false,
            'message' => 'Error al actualizar estado del usuario: ' . $e->getMessage()
        ], 500);
    }
    }

    #[Route('/event/{id}/toggle-status', name: 'app_admin_event_toggle_status', methods: ['PUT'])]
    public function toggleEventStatus(
        Request $request,
        EntityManagerInterface $entityManager,
        int $id,
    ): JsonResponse {
        try {
            // Encontrar el evento por ID
            $event = $entityManager->getRepository(Event::class)->find($id);
            
            if (!$event) {
                return $this->json([
                    'success' => false,
                    'message' => 'Evento no encontrado'
                ], 404);
            }
            
            // Obtener datos de la petición
            $data = json_decode($request->getContent(), true);
            $banned = $data['banned'] ?? false;
            
            // Actualizar el estado del evento
            $event->setBanned($banned);
            $entityManager->flush();
            
            return $this->json([
                'success' => true,
                'message' => $banned ? 'Evento bloqueado correctamente' : 'Evento desbloqueado correctamente',
                'event' => [
                    'id' => $event->getId(),
                    'title' => $event->getTitle(),
                    'banned' => $event->isBanned()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Error al actualizar estado del evento: ' . $e->getMessage()
            ], 500);
        }
    }
    
}