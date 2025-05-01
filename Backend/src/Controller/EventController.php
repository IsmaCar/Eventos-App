<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\Location;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
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
        ValidatorInterface $validator
        ): JsonResponse {
        // 1. Verificar y decodificar el JSON
        if (empty($request->getContent())) {
            return $this->json(
                ['error' => 'Empty request body'],
                Response::HTTP_BAD_REQUEST
            );
        }
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            return $this->json(
                ['error' => 'Invalid JSON format'],
                Response::HTTP_BAD_REQUEST
            );
        }
        // 2. Validar campos obligatorios
        $requiredFields = ['title', 'description', 'event_date'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return $this->json(
                    ['error' => "Field '$field' is required"],
                    Response::HTTP_BAD_REQUEST
                );
            }
        }
        // 3. Validar formato de fecha
        $date = \DateTime::createFromFormat('d/m/Y', $data['event_date']);
        if (!$date || $date->format('d/m/Y') !== $data['event_date']) {
            return $this->json(
                ['error' => 'Invalid date format. Expected format: d/m/Y'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $user = $entityManager->getRepository(User::class)->find($data['user_id']);
    if (!$user) {
        return $this->json(['error' => 'User not found'], Response::HTTP_BAD_REQUEST);
    }

        // Recibir ubicación si el campo existe
        $location = isset($data['location']) ? $data['location'] : null;
        // 4. Crear el evento
        $event = new Event();
        $event->setTitle($data['title']);
        $event->setDescription($data['description']);
        $event->setEventDate($date);
        $event->setUser($user);   
        if (isset($data['image'])) {
            $event->setImage($data['image']);
        }
        
        // 5. Validar la entidad
        $errors = $validator->validate($event) ?? [];
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return $this->json(
                ['error' => 'Validation failed', 'messages' => $errorMessages],
                Response::HTTP_BAD_REQUEST
            );
        }
        // 6. Persistir en la base de datos
        $entityManager->persist($event);
        $entityManager->flush();
    

        $locationData = isset($data['location']) ? $data['location'] : null;

if ($locationData) {
    $location = new Location();
    $location->setLatitude($locationData['latitude']);
    $location->setLength($locationData['length']);
    $location->setAddress($locationData['address']);
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
        
        return new JsonResponse(['message' => 'Event created successfully']);
    }
}

