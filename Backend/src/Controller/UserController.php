<?php

namespace App\Controller;

use App\Entity\Event;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;


final class UserController extends AbstractController
{
    private UserRepository $userRepository;
    private UserPasswordHasherInterface $passwordHasher;
    private EntityManagerInterface $entityManager;

    public function __construct(UserRepository $userRepository, UserPasswordHasherInterface $passwordHasher, EntityManagerInterface $entityManager)
    {
        $this->userRepository = $userRepository;
        $this->passwordHasher = $passwordHasher;
        $this->entityManager = $entityManager;
    }

    #[Route('/user', name: 'app_user')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/UserController.php',
        ]);
    }

    #[Route('/api/public/user/{id}', name: 'public_user_profile', methods: ['GET'])]
    public function getPublicUserProfile(int $id): JsonResponse
    {
        try {
            // Buscar al usuario por ID
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->json(['error' => 'Usuario no encontrado'], 404);
            }

            // Devolver datos públicos del usuario
            return $this->json([
                'user' => [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                    'avatar' => $user->getAvatar()

                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener el perfil: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/public/user/{id}/events', name: 'public_user_events', methods: ['GET'])]
    public function getPublicUserEvents(int $id): JsonResponse
    {
        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->json(['error' => 'Usuario no encontrado'], 404);
            }

            // Buscar eventos del usuario
            $events = $this->entityManager->getRepository(Event::class)->findBy([
                'user' => $user,
                'banned' => false,
                'status' => 'activated'
            ]);

            $eventData = [];
            foreach ($events as $event) {
                $location = $event->getLocation();
                $eventData[] = [
                    'id' => $event->getId(),
                    'title' => $event->getTitle(),
                    'description' => $event->getDescription(),
                    'event_date' => $event->getEventDate()->format('Y-m-d'),
                    'location' => $location ? [
                        'address' => $location->getAddress(),
                        'latitude' => $location->getLatitude(),
                        'longitude' => $location->getLongitude()
                    ] : null,
                    'image' => $event->getImage() ? '/uploads/backgrounds/' . $event->getImage() : null
                ];
            }

            return $this->json([
                'events' => $eventData
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener eventos: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/users/upload-avatar', name: 'upload_avatar', methods: ['POST'])]
    public function uploadAvatar(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var UserInterface $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            $uploadedFile = $request->files->get('avatar');

            if (!$uploadedFile) {
                return $this->json(['error' => 'No se ha enviado ningún archivo'], 400);
            }

            // Validar el tipo de archivo
            $mimeType = $uploadedFile->getMimeType();
            $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

            if (!in_array($mimeType, $allowedTypes)) {
                return $this->json(['error' => 'Tipo de archivo no permitido. Use PNG, JPEG, GIF o WEBP.'], 400);
            }

            // Validar tamaño (máximo 8MB)
            if ($uploadedFile->getSize() > 8 * 1024 * 1024) {
                return $this->json(['error' => 'El archivo es demasiado grande. Máximo 8MB.'], 400);
            }

            // Obtener el usuario de la base de datos 
            $identifier = $user->getUserIdentifier();

            // Intentar buscar primero por email
            $dbUser = $this->userRepository->findOneBy(['email' => $identifier]);

            if (!$dbUser) {
                $dbUser = $this->userRepository->findOneBy(['username' => $identifier]);
            }

            if (!$dbUser) {
                return $this->json(['error' => 'Usuario no encontrado en la base de datos'], 404);
            }

            // Generar nombre único para el archivo
            $fileName = uniqid() . '.' . $uploadedFile->guessExtension();

            // Definir directorio de destino
            $uploadsDirectory = $this->getParameter('avatars_directory');

            // Crear el directorio si no existe
            if (!file_exists($uploadsDirectory)) {
                mkdir($uploadsDirectory, 0777, true);
            }

            // Mover el archivo al directorio de destino
            $uploadedFile->move($uploadsDirectory, $fileName);

            // Eliminar avatar anterior si existe y no es el default
            $oldAvatar = $dbUser->getAvatar();
            if ($oldAvatar && $oldAvatar !== 'default-avatar.png') {
                $oldAvatarPath = $uploadsDirectory . '/' . $oldAvatar;
                if (file_exists($oldAvatarPath)) {
                    unlink($oldAvatarPath);
                }
            }

            // Actualizar el avatar del usuario
            $dbUser->setAvatar($fileName);

            // Guardar cambios en la base de datos
            $entityManager->persist($dbUser);
            $entityManager->flush();

            return $this->json([
                'message' => 'Avatar actualizado con éxito',
                'user' => [
                    'id' => $dbUser->getId(),
                    'username' => $dbUser->getUsername(),
                    'email' => $dbUser->getEmail(),
                    'avatar' => $fileName
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al subir el avatar: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/users/update', name: 'update_user', methods: ['PUT'])]
    public function updateUser(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var UserInterface $authUser */
        $authUser = $this->getUser();

        if (!$authUser) {
            return $this->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            // Obtener el usuario real de la base de datos (igual que haces en uploadAvatar)
            $identifier = $authUser->getUserIdentifier();

            // Intentar buscar primero por email
            $user = $this->userRepository->findOneBy(['email' => $identifier]);

            if (!$user) {
                $user = $this->userRepository->findOneBy(['username' => $identifier]);
            }

            if (!$user) {
                return $this->json(['error' => 'Usuario no encontrado en la base de datos'], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (isset($data['email'])) {
                $user->setEmail($data['email']);
            }

            if (isset($data['username'])) {
                $user->setUsername($data['username']);
            }

            if (isset($data['newPassword'])) {
                // Verificar la contraseña actual si se proporciona
                if (isset($data['currentPassword'])) {
                    $passwordEncoder = $this->passwordHasher;
                    if (!$passwordEncoder->isPasswordValid($user, $data['currentPassword'])) {
                        return $this->json(['error' => 'La contraseña actual es incorrecta'], 400);
                    }
                    $user->setPassword($passwordEncoder->hashPassword($user, $data['newPassword']));
                } else {
                    return $this->json(['error' => 'Debes proporcionar la contraseña actual para cambiar la contraseña'], 400);
                }
            }

            // Guardar cambios en la base de datos
            $entityManager->persist($user);
            $entityManager->flush();

            // Devolver los datos actualizados del usuario
            return $this->json([
                'message' => 'Usuario actualizado con éxito',
                'user' => [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                    'avatar' => $user->getAvatar()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al actualizar el usuario: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/user/stats', name: 'user_stats', methods: ['GET'])]
    public function getUserStats(): JsonResponse
    {
        /** @var UserInterface $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            // Obtener el identificador único del usuario
            $identifier = $user->getUserIdentifier();

            // Intentar buscar primero por email
            $dbUser = $this->userRepository->findOneBy(['email' => $identifier]);

            if (!$dbUser) {
                $dbUser = $this->userRepository->findOneBy(['username' => $identifier]);
            }

            if (!$dbUser) {
                return $this->json(['error' => 'Usuario no encontrado en la base de datos'], 404);
            }

            $userId = $dbUser->getId();

            $stats = $this->userRepository->getUserStatsById($userId);
            return $this->json($stats);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener estadísticas: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/user/event/', name: 'user_event', methods: ['GET'])]
    public function getUserEvent(): JsonResponse
    {
        /** @var UserInterface $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            // Obtener el identificador único del usuario
            $identifier = $user->getUserIdentifier();

            // Intentar buscar primero por email
            $dbUser = $this->userRepository->findOneBy(['email' => $identifier]);

            if (!$dbUser) {
                $dbUser = $this->userRepository->findOneBy(['username' => $identifier]);
            }

            if (!$dbUser) {
                return $this->json(['error' => 'Usuario no encontrado en la base de datos'], 404);
            }

            $userId = $dbUser->getId();

            $events = $this->userRepository->getEventByUserId($userId);
            return $this->json($events);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener eventos: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/tools/users/search', name: 'search_users', methods: ['GET'])]
    public function searchUsers(Request $request): JsonResponse
    {
        try {
            // Obtener el parámetro de consulta 'query'
            $query = $request->query->get('query');

            if (!$query || strlen($query) < 2) {
                return $this->json([
                    'users' => [],
                    'message' => 'La consulta debe tener al menos 2 caracteres'
                ]);
            }

            // Buscar usuarios por nombre de usuario o email
            $users = $this->userRepository->searchUsers($query);

            $userData = [];
            foreach ($users as $user) {
                $userData[] = [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'email' => $user->getEmail(),
                    'avatar' => $user->getAvatar()
                ];
            }

            return $this->json([
                'users' => $userData
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al buscar usuarios: ' . $e->getMessage()], 500);
        }
    }

}
