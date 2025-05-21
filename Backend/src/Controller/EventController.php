<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\Invitation;
use App\Entity\Location;
use App\Entity\Photo;
use App\Repository\EventRepository;
use App\Repository\InvitationRepository;
use App\Repository\PhotoRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class EventController extends AbstractController
{
    #[Route('/event', name: 'app_event')]
    public function index(): Response
    {
        return $this->render('event/index.html.twig', [
            'controller_name' => 'EventController',
        ]);
    }


    #[Route('/api/event/create', name: 'event_create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        SluggerInterface $slugger
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // 1. Recoger los datos principales
        $title = $request->request->get('title');
        $description = $request->request->get('description');
        $eventDateStr = $request->request->get('event_date');

        // Validación datos obligatorios
        if (!$title || !$description || !$eventDateStr) {
            return $this->json(['error' => 'Title, description and event_date are required'], Response::HTTP_BAD_REQUEST);
        }

        // Validar longitud de la descripción
        if (strlen($description) > 500) {
            return $this->json(['error' => 'La descripción no puede exceder los 500 caracteres'], Response::HTTP_BAD_REQUEST);
        }

        // Parsear la fecha - aceptar ambos formatos comunes
        try {
            // Intentar con formato d/m/Y (como envía el frontend)
            $date = \DateTime::createFromFormat('d/m/Y', $eventDateStr);
            if (!$date || $date->format('d/m/Y') !== $eventDateStr) {
                // Si no funciona, intentar con formato Y-m-d (ISO)
                $date = new \DateTime($eventDateStr);
            }

            // Verificar que la fecha no sea anterior a hoy
            $today = new \DateTime('today');
            if ($date < $today) {
                return $this->json(['error' => 'La fecha del evento no puede ser anterior a hoy'], Response::HTTP_BAD_REQUEST);
            }
        } catch (\Exception $e) {
            return $this->json(['error' => 'Invalid date format: ' . $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }


        // 2. Procesar la imagen (si existe)
        $imageFile = $request->files->get('image');
        $imageFilename = null;

        if ($imageFile) {
            // Asegurar que el directorio existe y es escribible
            $uploadsDir = $this->getParameter('kernel.project_dir') . '/public/uploads/backgrounds/';
            if (!file_exists($uploadsDir)) {
                mkdir($uploadsDir, 0777, true);
            }

            // Verificar si el archivo es válido
            if (!$imageFile->isValid()) {
                return $this->json([
                    'error' => 'Archivo inválido: ' . $imageFile->getErrorMessage()
                ], Response::HTTP_BAD_REQUEST);
            }

            // Generar nombre de archivo seguro
            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $slugger->slug($originalFilename);
            $extension = $imageFile->getClientOriginalExtension() ?: 'jpg';
            $newFilename = $safeFilename . '-' . uniqid() . '.' . $extension;

            try {
                // Mover el archivo
                $imageFile->move($uploadsDir, $newFilename);
                $imageFilename = $newFilename;
            } catch (\Exception $e) {
                return $this->json([
                    'error' => 'Error al procesar imagen: ' . $e->getMessage()
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }


        // 3. Crear el evento
        $event = new Event();
        $event->setTitle($title);
        $event->setDescription($description);
        $event->setEventDate($date);
        $event->setUser($user);
        $event->setBanned(false);

        if ($imageFilename) {
            $event->setImage($imageFilename);
        }

        $errors = $validator->validate($event);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return $this->json(['error' => 'Validation failed', 'messages' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($event);
        $entityManager->flush();

        // 4. Guardar ubicación si existe
        $address = $request->request->get('address');
        $latitude = $request->request->get('latitude');
        $longitude = $request->request->get('longitude');

        if ($address && $latitude && $longitude) {
            $location = new Location();
            $location->setAddress($address);
            $location->setLatitude((float)$latitude);
            $location->setLongitude((float)$longitude);
            $location->setEvent($event);

            $errors = $validator->validate($location);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return $this->json(['error' => 'Validation failed', 'messages' => $errorMessages], Response::HTTP_BAD_REQUEST);
            }

            $entityManager->persist($location);
            $entityManager->flush();
        }

        // Devolver respuesta con el evento creado
        return $this->json([
            'message' => 'Event created successfully',
            'event' => [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'description' => $event->getDescription(),
                'event_date' => $event->getEventDate()->format('Y-m-d'),
                'location' => $address ?? null,
                'image' => $imageFilename ? '/uploads/' . $imageFilename : null
            ]
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/event/', name: 'event_get', methods: ['GET'])]
    public function getEvents(
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Usar el método del repositorio para obtener todos los eventos del usuario
        $events = $entityManager->getRepository(Event::class)->findUserEvents($user);

        // Formatear la respuesta
        $eventData = [];
        foreach ($events as $event) {
            $location = $event->getLocation();
            $isOwner = $event->getUser() === $user;

            $eventData[] = [
                'id' => $event->getId(),
                'title' => $event->getTitle(),
                'description' => $event->getDescription(),
                'event_date' => $event->getEventDate()->format('Y-m-d'),
                'is_owner' => $isOwner,
                'owner' => [
                    'id' => $event->getUser()->getId(),
                    'username' => $event->getUser()->getUsername()
                ],
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
        ], Response::HTTP_OK);
    }

    #[Route('/api/event/{id}', name: 'event_get_by_id', methods: ['GET'])]
    public function getEventById(
        EntityManagerInterface $entityManager,
        InvitationRepository $invitationRepository,
        int $id
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener el evento por ID
        $event = $entityManager->getRepository(Event::class)->find($id);

        if (!$event) {
            return $this->json(['error' => 'Event not found'], Response::HTTP_NOT_FOUND);
        }

        // Verificar si el usuario es el creador del evento
        $isCreator = $event->getUser() && $event->getUser()->getUserIdentifier() === $user->getUserIdentifier();

        // Verificar si el usuario es administrador
        $isAdmin = in_array('ROLE_ADMIN', $user->getRoles());

        // Verificar si el usuario ha sido invitado y ha aceptado la invitación
        $invitation = $invitationRepository->findOneBy([
            'event' => $event,
            'invitedUser' => $user,
            'status' => Invitation::STATUS_ACCEPTED
        ]);
        $isInvitedAndAccepted = $invitation !== null;

        // Permitir acceso si es el creador, administrador o invitado que aceptó
        if (!$isCreator && !$isAdmin && !$isInvitedAndAccepted) {
            return $this->json(['error' => 'Not authorized to view this event'], Response::HTTP_FORBIDDEN);
        }

        // Devolver respuesta con el evento y la ubicación si existe
        $location = $event->getLocation();
        return $this->json([
            'event' => [
                'id' => $event->getId(),
                'user_id' => $event->getUser()->getId(),
                'title' => $event->getTitle(),
                'description' => $event->getDescription(),
                'event_date' => $event->getEventDate()->format('Y-m-d'),
                'user' => [
                    'identifier' => $event->getUser()->getUserIdentifier(),
                    'username' => $event->getUser()->getUsername()
                ],
                'location' => $location ? [
                    'address' => $location->getAddress(),
                    'latitude' => $location->getLatitude(),
                    'longitude' => $location->getLongitude()
                ] : null,
                'image' => $event->getImage() ? '/uploads/backgrounds/' . $event->getImage() : null
            ]
        ], Response::HTTP_OK);
    }

    #[Route('/api/events/{id}/photos', name: 'app_event_photos', methods: ['GET'])]
    public function getEventPhotos(
        int $id,
        EventRepository $eventRepository,
        PhotoRepository $photoRepository
    ): JsonResponse {
        $event = $eventRepository->find($id);

        if (!$event) {
            return $this->json(['message' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Usar el campo correcto para ordenar
        $photos = $photoRepository->findBy(['event' => $event], ['upload_date' => 'DESC']);

        $photosData = [];
        foreach ($photos as $photo) {
            $photosData[] = [
                'id' => $photo->getId(),
                // Usar el método getter correcto según tu entidad
                'filename' => $photo->getUrlPhoto(),
                'created_at' => $photo->getUploadDate()->format('Y-m-d H:i:s'),
                'user' => $photo->getUser() ? [
                    'id' => $photo->getUser()->getId(),
                    'username' => $photo->getUser()->getUsername(),
                    'avatar' => $photo->getUser()->getAvatar() ?? null  // Manejo de posible campo nulo
                ] : null
            ];
        }

        return $this->json([
            'event_id' => $id,
            'photos' => $photosData
        ]);
    }

    #[Route('/api/events/{id}/photos', name: 'app_event_upload_photo', methods: ['POST'])]
    public function uploadEventPhoto(
        Request $request,
        int $id,
        EventRepository $eventRepository,
        EntityManagerInterface $entityManager,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión para subir fotos'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($id);
        if (!$event) {
            return $this->json(['message' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $file = $request->files->get('photo');
        if (!$file) {
            return $this->json(['message' => 'No se ha enviado ningún archivo'], Response::HTTP_BAD_REQUEST);
        }

        // Validar que sea una imagen
        $mimeType = $file->getMimeType();
        if (!str_starts_with($mimeType, 'image/')) {
            return $this->json(['message' => 'El archivo debe ser una imagen'], Response::HTTP_BAD_REQUEST);
        }

        // Generar nombre único para la foto
        $filename = uniqid() . '.' . $file->guessExtension();

        try {
            // Crear directorio si no existe
            $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/event_photos/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Mover el archivo
            $file->move($uploadDir, $filename);

            // Crear la entidad EventPhoto
            $photo = new Photo();
            $photo->setEvent($event);
            $photo->setUser($user);
            $photo->setUrlPhoto($filename);
            $photo->setUploadDate(new \DateTime());

            $entityManager->persist($photo);
            $entityManager->flush();

            return $this->json([
                'message' => 'Foto subida correctamente',
                'photo' => [
                    'id' => $photo->getId(),
                    'filename' => $photo->getUrlPhoto(),
                    'created_at' => $photo->getUploadDate()->format('Y-m-d H:i:s')
                ]
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Error al subir la foto: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/api/events/{id}/attendees', name: 'event_attendees', methods: ['GET'])]
    public function getEventAttendees(
        int $id,
        EventRepository $eventRepository,
        InvitationRepository $invitationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Usuario no autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($id);
        if (!$event) {
            return $this->json(['error' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Obtener el creador del evento (siempre es un asistente)
        $eventCreator = $event->getUser();

        // Obtener invitaciones aceptadas para este evento
        $acceptedInvitations = $invitationRepository->findBy([
            'event' => $event,
            'status' => Invitation::STATUS_ACCEPTED
        ]);

        // Crear una lista de asistentes incluyendo al creador y las invitaciones aceptadas
        $attendees = [];

        // Añadir al creador como asistente
        $attendees[] = [
            'id' => $eventCreator->getId(),
            'username' => $eventCreator->getUsername(),
            'avatar' => $eventCreator->getAvatar(),
            'isCreator' => true
        ];

        // Añadir a los usuarios que aceptaron invitaciones
        foreach ($acceptedInvitations as $invitation) {
            $invitedUser = $invitation->getInvitedUser();
            if ($invitedUser) {
                // Evitar duplicados si el creador también está en las invitaciones aceptadas
                if ($invitedUser->getId() !== $eventCreator->getId()) {
                    $attendees[] = [
                        'id' => $invitedUser->getId(),
                        'username' => $invitedUser->getUsername(),
                        'avatar' => $invitedUser->getAvatar(),
                        'isCreator' => false
                    ];
                }
            }
        }

        return $this->json([
            'event_id' => $id,
            'attendees' => $attendees
        ]);
    }

    #[Route('/api/events/{id}/cancel-attendance', name: 'event_cancel_attendance', methods: ['POST'])]
    public function cancelAttendance(
        int $id,
        EventRepository $eventRepository,
        InvitationRepository $invitationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Usuario no autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($id);
        if (!$event) {
            return $this->json(['error' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que el usuario no es el organizador
        // Ahora comparamos usando getUserIdentifier() para mayor consistencia
        if ($event->getUser() && $event->getUser()->getUserIdentifier() === $user->getUserIdentifier()) {
            return $this->json(['error' => 'El organizador no puede cancelar su asistencia'], Response::HTTP_BAD_REQUEST);
        }

        // Buscar la invitación aceptada
        $invitation = $invitationRepository->findOneBy([
            'event' => $event,
            'invitedUser' => $user,
            'status' => Invitation::STATUS_ACCEPTED
        ]);

        if (!$invitation) {
            return $this->json(['error' => 'No se encontró una invitación aceptada para este usuario'], Response::HTTP_NOT_FOUND);
        }

        // Cambiar el estado de la invitación a REJECTED
        $invitation->setStatus(Invitation::STATUS_REJECTED);
        $entityManager->persist($invitation);
        $entityManager->flush();

        return $this->json(['success' => true, 'message' => 'Asistencia cancelada correctamente']);
    }

    #[Route('/api/events/{id}/remove-attendee/{attendeeId}', name: 'event_remove_attendee', methods: ['POST'])]
    public function removeAttendee(
        int $id,
        int $attendeeId,
        EntityManagerInterface $entityManager,
        EventRepository $eventRepository,
        UserRepository $userRepository,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['error' => 'Usuario no autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($id);
        if (!$event) {
            return $this->json(['error' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Verificar que el usuario actual es el organizador del evento
        if ($event->getUser()->getUserIdentifier() !== $user->getUserIdentifier()) {
            return $this->json(['error' => 'No tienes permiso para realizar esta acción'], Response::HTTP_FORBIDDEN);
        }

        $attendeeToRemove = $userRepository->find($attendeeId);
        if (!$attendeeToRemove) {
            return $this->json(['error' => 'Usuario a eliminar no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // No permitir eliminar al organizador
        if ($attendeeToRemove->getId() === $event->getUser()->getId()) {
            return $this->json(['error' => 'No puedes eliminar al organizador del evento'], Response::HTTP_BAD_REQUEST);
        }

        // Buscar y eliminar la invitación o asistencia
        $invitation = $entityManager->getRepository(Invitation::class)->findOneBy([
            'event' => $event,
            'invitedUser' => $attendeeToRemove,
            'status' => 'accepted'
        ]);

        if ($invitation) {
            // Cambiar el estado a "removed" en lugar de eliminar, para mantener el registro
            $invitation->setStatus('removed');
            $entityManager->flush();

            return $this->json(['message' => 'Asistente eliminado correctamente']);
        }

        return $this->json(['error' => 'El usuario no era un asistente de este evento'], Response::HTTP_NOT_FOUND);
    }

    #[Route('/api/event/delete/{id}', name: 'event_delete', methods: ['DELETE'])]
public function deleteEvent(
    int $id,
    EventRepository $eventRepository,
    EntityManagerInterface $entityManager,
    Security $security
): JsonResponse {
    $user = $security->getUser();
    if (!$user) {
        return $this->json(['error' => 'Usuario no autenticado'], Response::HTTP_UNAUTHORIZED);
    }

    $event = $eventRepository->find($id);
    if (!$event) {
        return $this->json(['error' => 'Evento no encontrado'], Response::HTTP_NOT_FOUND);
    }

    // Verificar que el usuario actual es el creador del evento
    if ($event->getUser()->getUserIdentifier() !== $user->getUserIdentifier()) {
        return $this->json(['error' => 'No tienes permiso para eliminar este evento'], Response::HTTP_FORBIDDEN);
    }

    try {
        // Borrado lógico: cambiar estado a 'desactivated'
        $event->setStatus('desactivated');
        
        // También podemos actualizar un campo específico de fecha de desactivación si existe
        if (method_exists($event, 'setDeactivatedAt')) {
            $event->setDeactivatedAt(new \DateTime());
        }
        
        $entityManager->flush();

        return $this->json(['message' => 'Evento desactivado correctamente']);
    } catch (\Exception $e) {
        return $this->json(['error' => 'Error al desactivar el evento: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}
}
