<?php
// filepath: c:\Users\ismac\OneDrive\Escritorio\TFG\Eventos-App\Backend\src\Controller\FriendshipController.php

namespace App\Controller;

use App\Entity\Friendship;
use App\Entity\User;
use App\Repository\FriendshipRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class FriendshipController extends AbstractController
{
    #[Route('/friends', name: 'app_friends_list', methods: ['GET'])]
    public function getFriends(
        Security $security,
        FriendshipRepository $friendshipRepository
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener todas las amistades aceptadas
        $friendships = $friendshipRepository->findAcceptedFriendships($user);

        // Transformar los datos de amistades a datos de amigos
        $friends = [];
        foreach ($friendships as $friendship) {
            // Identificar quién es el amigo (el otro usuario)
            $friend = $friendship->getRequester() === $user
                ? $friendship->getAddressee()
                : $friendship->getRequester();

            // Añadir información relevante del amigo
            $friends[] = [
                'friendship_id' => $friendship->getId(),
                'user_id' => $friend->getId(),
                'username' => $friend->getUsername(),
                'avatar' => $friend->getAvatar(),
                'since' => $friendship->getCreatedAt()->format('Y-m-d H:i:s')
            ];
        }

        return $this->json([
            'friends' => $friends,
            'count' => count($friends)
        ]);
    }

    #[Route('/friends/requests/received', name: 'app_friend_requests', methods: ['GET'])]
    public function getFriendRequests(
        Security $security,
        FriendshipRepository $friendshipRepository
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener solicitudes de amistad pendientes recibidas
        $pendingRequests = $friendshipRepository->findPendingFriendRequests($user);

        // Formatear los datos para la respuesta
        $requests = [];
        foreach ($pendingRequests as $request) {
            $requester = $request->getRequester();
            $requests[] = [
                'id' => $request->getId(),
                'requester' => [
                    'id' => $requester->getId(),
                    'username' => $requester->getUsername(),
                    'avatar' => $requester->getAvatar(),
                ],
                'created_at' => $request->getCreatedAt()->format('Y-m-d H:i:s')
            ];
        }

        return $this->json([
            'requests' => $requests,
            'count' => count($requests)
        ]);
    }

    #[Route('/friends/sent-requests', name: 'app_sent_friend_requests', methods: ['GET'])]
    public function getSentFriendRequests(
        Security $security,
        FriendshipRepository $friendshipRepository
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener solicitudes de amistad enviadas pendientes
        $sentRequests = $friendshipRepository->findSentPendingRequests($user);

        // Formatear los datos para la respuesta
        $requests = [];
        foreach ($sentRequests as $request) {
            $addressee = $request->getAddressee();
            $requests[] = [
                'id' => $request->getId(),
                'addressee' => [
                    'id' => $addressee->getId(),
                    'username' => $addressee->getUsername(),
                    'avatar' => $addressee->getAvatar(),
                ],
                'created_at' => $request->getCreatedAt()->format('Y-m-d H:i:s')
            ];
        }

        return $this->json([
            'sent_requests' => $requests,
            'count' => count($requests)
        ]);
    }

    #[Route('/friends/request/{id}', name: 'app_send_friend_request', methods: ['POST'])]
    public function sendFriendRequest(
        int $id,
        Security $security,
        UserRepository $userRepository,
        FriendshipRepository $friendshipRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $requester */
        $requester = $security->getUser();
        if (!$requester) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // No permitir enviar solicitud a uno mismo
        if ($requester->getId() == $id) {
            return $this->json(['message' => 'No puedes enviarte una solicitud de amistad a ti mismo'], Response::HTTP_BAD_REQUEST);
        }

        // Buscar al destinatario
        $addressee = $userRepository->find($id);
        if (!$addressee) {
            return $this->json(['message' => 'Usuario no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // FIX: Comprobar si ya hay una amistad EN CUALQUIER DIRECCIÓN
        $existingFriendship = $friendshipRepository->findAnyFriendshipBetween($requester, $addressee);

        if ($existingFriendship) {
            $status = $existingFriendship->getStatus();

            // FIX: Si ya son amigos, no permitir enviar solicitud
            if ($status === Friendship::STATUS_ACCEPTED) {
                return $this->json(['message' => 'Ya sois amigos'], Response::HTTP_CONFLICT);
            }

            if ($status === Friendship::STATUS_PENDING) {
                // Verificar quién envió la solicitud
                if ($existingFriendship->getRequester() === $requester) {
                    return $this->json(['message' => 'Ya has enviado una solicitud de amistad a este usuario'], Response::HTTP_CONFLICT);
                } else {
                    // Si el otro usuario nos envió una solicitud, la aceptamos automáticamente
                    $existingFriendship->setStatus(Friendship::STATUS_ACCEPTED);
                    $entityManager->flush();

                    return $this->json([
                        'message' => 'Solicitud de amistad aceptada automáticamente',
                        'friendship' => [
                            'id' => $existingFriendship->getId(),
                            'status' => $existingFriendship->getStatus(),
                            'created_at' => $existingFriendship->getCreatedAt()->format('Y-m-d H:i:s')
                        ]
                    ]);
                }
            }

            if ($status === Friendship::STATUS_REJECTED) {
                // FIX: Solo permitir reenvío si el usuario actual fue quien envió la solicitud original
                if ($existingFriendship->getRequester() === $requester) {
                    $existingFriendship->setStatus(Friendship::STATUS_PENDING);
                    $entityManager->flush();

                    return $this->json([
                        'message' => 'Solicitud de amistad reenviada',
                        'friendship' => [
                            'id' => $existingFriendship->getId(),
                            'status' => $existingFriendship->getStatus()
                        ]
                    ]);
                } else {
                    return $this->json(['message' => 'No puedes enviar solicitud a este usuario'], Response::HTTP_FORBIDDEN);
                }
            }

            if ($status === Friendship::STATUS_BLOCKED) {
                return $this->json(['message' => 'No es posible enviar una solicitud a este usuario'], Response::HTTP_FORBIDDEN);
            }
        }

        // Crear nueva solicitud de amistad
        $friendship = new Friendship();
        $friendship->setRequester($requester);
        $friendship->setAddressee($addressee);
        $friendship->setStatus(Friendship::STATUS_PENDING);

        $entityManager->persist($friendship);
        $entityManager->flush();

        return $this->json([
            'message' => 'Solicitud de amistad enviada',
            'friendship' => [
                'id' => $friendship->getId(),
                'status' => $friendship->getStatus(),
                'created_at' => $friendship->getCreatedAt()->format('Y-m-d H:i:s'),
                'addressee' => [
                    'id' => $addressee->getId(),
                    'username' => $addressee->getUsername()
                ]
            ]
        ], Response::HTTP_CREATED);
    }

    #[Route('/friends/accept/{id}', name: 'app_accept_friend_request', methods: ['POST'])]
    public function acceptFriendRequest(
        int $id,
        Security $security,
        FriendshipRepository $friendshipRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Buscar la solicitud de amistad
        $friendship = $friendshipRepository->find($id);
        if (!$friendship) {
            return $this->json(['message' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que el usuario es el destinatario
        if ($friendship->getAddressee() !== $user) {
            return $this->json(['message' => 'No tienes permiso para responder a esta solicitud'], Response::HTTP_FORBIDDEN);
        }

        // Verificar que la solicitud está en estado pendiente
        if ($friendship->getStatus() !== Friendship::STATUS_PENDING) {
            return $this->json(['message' => 'Esta solicitud ya no está pendiente'], Response::HTTP_BAD_REQUEST);
        }

        // Aceptar solicitud
        $friendship->setStatus(Friendship::STATUS_ACCEPTED);
        $entityManager->flush();

        return $this->json([
            'message' => 'Solicitud de amistad aceptada',
            'friendship' => [
                'id' => $friendship->getId(),
                'status' => $friendship->getStatus(),
                'updated_at' => $friendship->getUpdatedAt() ? $friendship->getUpdatedAt()->format('Y-m-d H:i:s') : null
            ]
        ]);
    }

    #[Route('/friends/reject/{id}', name: 'app_reject_friend_request', methods: ['POST'])]
    public function rejectFriendRequest(
        int $id,
        Security $security,
        FriendshipRepository $friendshipRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Buscar la solicitud de amistad
        $friendship = $friendshipRepository->find($id);
        if (!$friendship) {
            return $this->json(['message' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que el usuario es el destinatario
        if ($friendship->getAddressee() !== $user) {
            return $this->json(['message' => 'No tienes permiso para responder a esta solicitud'], Response::HTTP_FORBIDDEN);
        }

        // Verificar que la solicitud está en estado pendiente
        if ($friendship->getStatus() !== Friendship::STATUS_PENDING) {
            return $this->json(['message' => 'Esta solicitud ya no está pendiente'], Response::HTTP_BAD_REQUEST);
        }

        // Rechazar solicitud
        $friendship->setStatus(Friendship::STATUS_REJECTED);
        $entityManager->flush();

        return $this->json([
            'message' => 'Solicitud de amistad rechazada',
            'friendship' => [
                'id' => $friendship->getId(),
                'status' => $friendship->getStatus(),
                'updated_at' => $friendship->getUpdatedAt() ? $friendship->getUpdatedAt()->format('Y-m-d H:i:s') : null
            ]
        ]);
    }
    #[Route('/friends/{id}', name: 'app_remove_friend', methods: ['DELETE'])]
    public function removeFriend(
        int $id,
        Security $security,
        FriendshipRepository $friendshipRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Buscar la amistad
        $friendship = $friendshipRepository->find($id);
        if (!$friendship) {
            return $this->json(['message' => 'Amistad no encontrada'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que el usuario es parte de esta amistad
        if ($friendship->getRequester() !== $user && $friendship->getAddressee() !== $user) {
            return $this->json(['message' => 'No tienes permiso para eliminar esta amistad'], Response::HTTP_FORBIDDEN);
        }

        // Eliminar la amistad
        $entityManager->remove($friendship);
        $entityManager->flush();

        return $this->json([
            'message' => 'Amistad eliminada correctamente'
        ]);
    }

    #[Route('/friends/check/{id}', name: 'app_check_friendship_status', methods: ['GET'])]
    public function checkFriendshipStatus(
        int $id,
        Security $security,
        UserRepository $userRepository,
        FriendshipRepository $friendshipRepository
    ): JsonResponse {
        /** @var User $currentUser */
        $currentUser = $security->getUser();
        if (!$currentUser) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener el otro usuario
        $otherUser = $userRepository->find($id);
        if (!$otherUser) {
            return $this->json(['message' => 'Usuario no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Si es el mismo usuario
        if ($currentUser->getId() == $otherUser->getId()) {
            return $this->json(['status' => 'self']);
        }

        // PASO 1: Verificar primero si hay una amistad ACEPTADA en cualquier dirección
        $acceptedFriendship = $friendshipRepository->findAnyFriendshipBetween($currentUser, $otherUser);
        if ($acceptedFriendship) {
            return $this->json([
                'status' => 'friends',
                'friendship_id' => $acceptedFriendship->getId()
            ]);
        }

        // PASO 2: Si no hay amistad aceptada, verificar solicitudes pendientes

        // Verificar solicitud enviada por el usuario actual
        $outgoingRequest = $friendshipRepository->findFriendshipBetween($currentUser, $otherUser);
        if ($outgoingRequest && $outgoingRequest->getStatus() === Friendship::STATUS_PENDING) {
            return $this->json([
                'status' => 'pending',
                'is_requester' => true,
                'friendship_id' => $outgoingRequest->getId()
            ]);
        }

        // Verificar solicitud recibida por el usuario actual
        $incomingRequest = $friendshipRepository->findFriendshipBetween($otherUser, $currentUser);
        if ($incomingRequest && $incomingRequest->getStatus() === Friendship::STATUS_PENDING) {
            return $this->json([
                'status' => 'pending',
                'is_requester' => false,
                'friendship_id' => $incomingRequest->getId()
            ]);
        }

        // PASO 3: Verificar otros estados (rechazado, bloqueado, etc.)
        if ($outgoingRequest) {
            return $this->json([
                'status' => $outgoingRequest->getStatus(),
                'friendship_id' => $outgoingRequest->getId()
            ]);
        }

        if ($incomingRequest) {
            return $this->json([
                'status' => $incomingRequest->getStatus(),
                'friendship_id' => $incomingRequest->getId()
            ]);
        }

        // Si no hay ninguna relación
        return $this->json(['status' => 'none']);
    }

    #[Route('/friends/search', name: 'app_search_friends', methods: ['GET'])]
    public function searchPotentialFriends(
        Request $request,
        Security $security,
        UserRepository $userRepository,
        FriendshipRepository $friendshipRepository
    ): JsonResponse {
        /** @var User $user */
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        $term = $request->query->get('term');
        if (!$term || strlen($term) < 3) {
            return $this->json(['message' => 'El término de búsqueda debe tener al menos 3 caracteres'], Response::HTTP_BAD_REQUEST);
        }

        // Buscar usuarios por término, excluyendo al usuario actual
        $matchingUsers = $userRepository->findBySearchTerm($term, [$user->getId()]);

        // Formatear resultados añadiendo información de amistad
        $results = [];
        foreach ($matchingUsers as $matchingUser) {
            // Determinar el estado de amistad
            $friendshipStatus = 'none';
            $friendshipId = null;
            $isRequester = false;

            // PRIMERO: Verificar si hay una amistad ACEPTADA en AMBAS DIRECCIONES
            $acceptedFriendship = $friendshipRepository->findAnyFriendshipBetween($user, $matchingUser);
            if ($acceptedFriendship) {
                $friendshipStatus = 'friends';
                $friendshipId = $acceptedFriendship->getId();
            } else {
                // Si no hay amistad aceptada, verificar otras relaciones
                // Solicitud enviada por el usuario actual
                $outgoingRequest = $friendshipRepository->findFriendshipBetween($user, $matchingUser);
                if ($outgoingRequest) {
                    $friendshipId = $outgoingRequest->getId();
                    $status = $outgoingRequest->getStatus();

                    if ($status === Friendship::STATUS_PENDING) {
                        $friendshipStatus = 'pending';
                        $isRequester = true;
                    } elseif ($status === Friendship::STATUS_REJECTED) {
                        $friendshipStatus = 'rejected';
                    } elseif ($status === Friendship::STATUS_BLOCKED) {
                        $friendshipStatus = 'blocked';
                    }
                } else {
                    // Solicitud recibida por el usuario actual
                    $incomingRequest = $friendshipRepository->findFriendshipBetween($matchingUser, $user);
                    if ($incomingRequest && $incomingRequest->getStatus() === Friendship::STATUS_PENDING) {
                        $friendshipStatus = 'pending';
                        $friendshipId = $incomingRequest->getId();
                        $isRequester = false;
                    }
                }
            }

            $results[] = [
                'id' => $matchingUser->getId(),
                'username' => $matchingUser->getUsername(),
                'avatar' => $matchingUser->getAvatar(),
                'friendship_status' => $friendshipStatus,
                'friendship_id' => $friendshipId,
                'is_requester' => $isRequester
            ];
        }

        return $this->json([
            'users' => $results,
            'count' => count($results)
        ]);
    }

    #[Route('/friends/user/{id}', name: 'public_user_friends', methods: ['GET'])]
    public function getPublicUserFriends(int $id, FriendshipRepository $friendshipRepository, UserRepository $userRepository): JsonResponse
    {
        try {
            // Buscar al usuario por ID
            $targetUser = $userRepository->find($id);

            if (!$targetUser) {
                return $this->json(['error' => 'Usuario no encontrado'], 404);
            }

            // Obtener amistades aceptadas del usuario
            $friendships = $friendshipRepository->findAcceptedFriendships($targetUser);

            // Transformar los datos de amistades a datos de amigos
            $friends = [];
            foreach ($friendships as $friendship) {
                // Identificar quién es el amigo (el otro usuario)
                $friend = $friendship->getRequester() === $targetUser
                    ? $friendship->getAddressee()
                    : $friendship->getRequester();

                // Añadir información relevante del amigo
                $friends[] = [
                    'friendship_id' => $friendship->getId(),
                    'user_id' => $friend->getId(),
                    'username' => $friend->getUsername(),
                    'avatar' => $friend->getAvatar(),
                    'since' => $friendship->getCreatedAt()->format('Y-m-d H:i:s')
                ];
            }

            return $this->json([
                'friends' => $friends,
                'count' => count($friends)
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener amigos: ' . $e->getMessage()], 500);
        }
    }
}
