<?php

namespace App\Controller;

use App\Repository\EventRepository;
use App\Repository\InvitationRepository;
use App\Service\EmailService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use App\Repository\UserRepository;
use App\Entity\Invitation;
use Normalizer;

#[Route('/api')]
final class InvitationController extends AbstractController
{
    #[Route('/invitation', name: 'app_invitation')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/InvitationController.php',
        ]);
    }
    #[Route('/events/{id}/invite', name: 'app_event_invite', methods: ['POST'])]
    public function inviteToEvent(
        int $id,
        Request $request,
        EventRepository $eventRepository,
        UserRepository $userRepository,
        InvitationRepository $invitationRepository,
        EntityManagerInterface $entityManager,
        Security $security,
        ValidatorInterface $validator,
        EmailService $emailService
    ): JsonResponse {
        try {
            $user = $security->getUser();
            if (!$user) {
                return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
            }

            $event = $eventRepository->find($id);
            if (!$event) {
                return $this->json(['message' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
            }

            $data = json_decode($request->getContent(), true);

            if (!isset($data['username']) && !isset($data['email'])) {
                return $this->json(['message' => 'Debes proporcionar un nombre de usuario o email'], Response::HTTP_BAD_REQUEST);
            }

            if (isset($data['email']) && strtolower(trim($data['email'])) === strtolower($user->getUserIdentifier())) {
                return $this->json(['message' => 'No puedes invitarte a ti mismo'], Response::HTTP_BAD_REQUEST);
            }

            if (isset($data['username']) && strtolower(trim($data['username'])) === strtolower($user->getUserIdentifier())) {
                return $this->json(['message' => 'No puedes invitarte a ti mismo'], Response::HTTP_BAD_REQUEST);
            }

            // Validar que el evento no haya pasado (permitir invitaciones el mismo día)
            $eventDate = $event->getEventDate();
            $today = new \DateTime();

            // Comparar solo fechas, no horas - permite invitaciones durante todo el día del evento
            $eventDateOnly = $eventDate->format('Y-m-d');
            $todayOnly = $today->format('Y-m-d');

            if ($eventDateOnly < $todayOnly) {
                return $this->json(['message' => 'No puedes invitar a un evento que ya ha pasado'], Response::HTTP_BAD_REQUEST);
            }

            $invitation = new Invitation();
            $invitation->setEvent($event);
            $invitation->setInvitedBy($user);
            $invitation->setStatus('pending');
            $invitation->setCreatedAt(new \DateTime());
            $invitation->setToken(null);

            $userExists = false;

            if (isset($data['username'])) {
                // Invitación por username
                $invitedUser = $userRepository->findOneBy(['username' => trim($data['username'])]);

                if (!$invitedUser) {
                    return $this->json(['message' => 'Usuario no encontrado'], Response::HTTP_NOT_FOUND);
                }

                // Verificar si el usuario está baneado
                if ($invitedUser->isBanned()) {
                    return $this->json(['message' => 'Este usuario está baneado y no puede ser invitado'], Response::HTTP_FORBIDDEN);
                }

                if ($invitationRepository->isUserInvited($invitedUser, $event)) {
                    return $this->json(['message' => 'Este usuario ya ha sido invitado'], Response::HTTP_CONFLICT);
                }

                $invitation->setInvitedUser($invitedUser);
                $invitation->setEmail($invitedUser->getEmail());
                $userExists = true;
            } else {
                // Invitación por email
                $email = trim($data['email']);

                // Verificar si ya está invitado
                if ($invitationRepository->isEmailInvited($email, $event)) {
                    return $this->json(['message' => 'Este email ya ha sido invitado'], Response::HTTP_CONFLICT);
                }

                // Asignar email a la invitación
                $invitation->setEmail($email);

                // Buscar usuario por email (insensible a mayúsculas/minúsculas)
                $existingUser = $userRepository->findByEmailInsensitive($email);

                if ($existingUser) {
                    // Verificar si el usuario está baneado
                    if ($existingUser->isBanned()) {
                        return $this->json(['message' => 'Este usuario está baneado y no puede ser invitado'], Response::HTTP_FORBIDDEN);
                    }

                    // Usuario registrado: asociar con la invitación
                    $invitation->setInvitedUser($existingUser);
                    $userExists = true;
                } else {
                    // Usuario no registrado: generar token para registro
                    $token = bin2hex(random_bytes(32));
                    $invitation->setToken($token);
                }

                // Enviar email
                try {
                    $emailService->sendEventInvitation($invitation);
                } catch (\Exception $e) {
                    error_log('Error al enviar email: ' . $e->getMessage());
                    // Continuar con el proceso aunque falle el email
                }
            }

            // Validar y persistir
            $errors = $validator->validate($invitation);
            if (count($errors) > 0) {
                return $this->json(['message' => (string) $errors], Response::HTTP_BAD_REQUEST);
            }

            $entityManager->persist($invitation);
            $entityManager->flush();

            // Devolver respuesta
            return $this->json([
                'message' => 'Invitación enviada correctamente',
                'userExists' => $userExists,
                'invitation' => [
                    'id' => $invitation->getId(),
                    'status' => $invitation->getStatus(),
                    'email' => $invitation->getEmail(),
                    'created_at' => $invitation->getCreatedAt()->format('Y-m-d'),
                    'token' => $userExists ? null : $invitation->getToken(), // Solo incluir token si no existe usuario
                    'invitedUser' => $invitation->getInvitedUser() ? [
                        'id' => $invitation->getInvitedUser()->getId(),
                        'username' => $invitation->getInvitedUser()->getUsername()
                    ] : null
                ]
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            error_log('ERROR EN INVITACIÓN: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return $this->json([
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    #[Route('/invitations/{id}/respond', name: 'app_invitation_respond', methods: ['POST'])]
    public function respondToInvitation(
        int $id,
        Request $request,
        InvitationRepository $invitationRepository,
        EntityManagerInterface $entityManager,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        $invitation = $invitationRepository->find($id);
        if (!$invitation) {
            return $this->json(['message' => 'Invitación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que la invitación corresponde al usuario
        if (($invitation->getInvitedUser() !== $user) && ($invitation->getEmail() !== $user->getUserIdentifier())) {
            return $this->json(['message' => 'No tienes permiso para responder a esta invitación'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $response = $data['response'] ?? null;

        if (!in_array($response, ['accept', 'reject'])) {
            return $this->json(['message' => 'Respuesta inválida'], Response::HTTP_BAD_REQUEST);
        }

        // Actualizar invitación
        if ($response === 'accept') {
            $invitation->setStatus(Invitation::STATUS_ACCEPTED);
        } else {
            $invitation->setStatus(Invitation::STATUS_REJECTED);
        }

        // Si no tenía usuario asignado pero ahora hay uno registrado
        if ($invitation->getInvitedUser() === null) {
            $invitation->setInvitedUser($user);
        }

        $entityManager->flush();

        return $this->json([
            'message' => $response === 'accept' ? 'Has aceptado la invitación' : 'Has rechazado la invitación',
            'invitation' => [
                'id' => $invitation->getId(),
                'status' => $invitation->getStatus(),
                'event' => [
                    'id' => $invitation->getEvent()->getId(),
                    'title' => $invitation->getEvent()->getTitle()
                ]
            ]
        ]);
    }

    #[Route('/invitations', name: 'app_user_invitations', methods: ['GET'])]
    public function getUserInvitations(
        InvitationRepository $invitationRepository,
        Security $security,
        NormalizerInterface $normalizer
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        $invitations = $invitationRepository->findByUser($user);
        return $this->json([
            'invitations' => $normalizer->normalize($invitations, null, ['groups' => 'invitation:read']),
            'count' => count($invitations)
        ]);
    }

    #[Route('/events/{id}/invitations', name: 'app_event_invitations', methods: ['GET'])]
    public function getEventInvitations(
        int $id,
        EventRepository $eventRepository,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($id);

        if (!$event) {
            return $this->json(['message' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que el usuario es el creador del evento o un administrador
        if ($event->getUser() !== $user && !in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json(['message' => 'No tienes permiso para ver estas invitaciones'], Response::HTTP_FORBIDDEN);
        }

        $invitations = $event->getInvitations();
        $invitationsData = [];

        // Normalización manual para evitar referencias IRI
        foreach ($invitations as $invitation) {
            $invitedUser = $invitation->getInvitedUser();

            $invitationsData[] = [
                'id' => $invitation->getId(),
                'email' => $invitation->getEmail(),
                'status' => $invitation->getStatus(),
                'created_at' => $invitation->getCreatedAt()->format('Y-m-d H:i:s'),
                'token' => $invitation->getToken(), // null para usuarios registrados
                // Crear objeto invitedUser explícitamente
                'invitedUser' => $invitedUser ? [
                    'id' => $invitedUser->getId(),
                    'username' => $invitedUser->getUsername(),
                    'avatar' => $invitedUser->getAvatar()
                ] : null
            ];
        }

        return $this->json([
            'invitations' => $invitationsData,
            'count' => count($invitations)
        ]);
    }

    #[Route('/invitations/verify/{token}', name: 'app_invitation_verify', methods: ['GET'])]
    public function verifyInvitation(
        string $token,
        InvitationRepository $invitationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $invitation = $invitationRepository->findOneBy(['token' => $token]);

        if (!$invitation) {
            return $this->json(['message' => 'Invitación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        // Marcar el token como usado
        $invitation->setToken(null);
        $entityManager->flush();

        return $this->json([
            'message' => 'Token verificado correctamente',
            'invitation' => [
                'id' => $invitation->getId(),
                'event' => [
                    'id' => $invitation->getEvent()->getId(),
                    'title' => $invitation->getEvent()->getTitle()
                ],
                'email' => $invitation->getEmail()
            ]
        ]);
    }

    #[Route('/invitations/user/received', name: 'app_invitations_received', methods: ['GET'])]
    public function getReceivedInvitations(
        Security $security,
        InvitationRepository $invitationRepository
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $invitations = $invitationRepository->findByUserOrEmail($user, $user->getUserIdentifier());
        $invitationsData = [];

        foreach ($invitations as $invitation) {
            $event = $invitation->getEvent();
            $invitedBy = $invitation->getInvitedBy();

            $invitationsData[] = [
                'id' => $invitation->getId(),
                'status' => $invitation->getStatus(),
                'createdAt' => $invitation->getCreatedAt()->format('Y-m-d H:i:s'),
                'email' => $invitation->getEmail(),
                'token' => $invitation->getToken(),
                'event' => [
                    'id' => $event ? $event->getId() : null,
                    'title' => $event ? $event->getTitle() : 'Evento desconocido',
                    'description' => $event ? $event->getDescription() : '',
                    'eventDate' => $event && $event->getEventDate() ? $event->getEventDate()->format('Y-m-d') : null
                ],
                'invitedBy' => $invitedBy ? [
                    'id' => $invitedBy->getId(),
                    'username' => $invitedBy->getUsername()
                ] : null,
            ];
        }

        return $this->json([
            'invitations' => $invitationsData,
            'count' => count($invitations)
        ]);
    }
}
