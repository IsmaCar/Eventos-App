<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\Location;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
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

        // Parsear la fecha - aceptar ambos formatos comunes
        try {
            // Intentar con formato d/m/Y (como envía el frontend)
            $date = \DateTime::createFromFormat('d/m/Y', $eventDateStr);
            if (!$date || $date->format('d/m/Y') !== $eventDateStr) {
                // Si no funciona, intentar con formato Y-m-d (ISO)
                $date = new \DateTime($eventDateStr);
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
        Request $request
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener los eventos del usuario autenticado
        $events = $entityManager->getRepository(Event::class)->findBy(['user' => $user]);

        // Devolver respuesta con los eventos y la ubicación si existe
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
        ], Response::HTTP_OK);
    }

    #[Route('/api/event/{id}', name: 'event_get_by_id', methods: ['GET'])]
    public function getEventById(
        EntityManagerInterface $entityManager,
        int $id
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'User not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Obtener el evento por ID
        $event = $entityManager->getRepository(Event::class)->find($id);

        if (!$event || $event->getUser() !== $user) {
            return $this->json(['error' => 'Event not found or not authorized'], Response::HTTP_NOT_FOUND);
        }

        // Devolver respuesta con el evento y la ubicación si existe
        $location = $event->getLocation();
        return $this->json([
            'event' => [
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
            ]
        ], Response::HTTP_OK);
    }
}

