<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class UserController extends AbstractController
{
    #[Route('/user', name: 'app_user')]
    public function index(): JsonResponse
    {
        return $this->json(['message' => 'API response']);
    }

    #[Route('/api/register', name: 'user_create', methods: ['POST'])]
    public function createUser(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
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
    $requiredFields = ['username', 'email', 'password'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return $this->json(
                ['error' => "Field '$field' is required"], 
                Response::HTTP_BAD_REQUEST
            );
        }
    }

    // 3. Crear y configurar el usuario
    $user = new User();
    $user->setUsername($data['username']);
    $user->setEmail($data['email']);
    $user->setPassword($passwordHasher->hashPassword($user, $data['password']));
    $user->setRoles($data['roles'] ?? ['ROLE_USER']); // Rol por defecto

    // 4. Validar la entidad
    $errors = $validator->validate($user);
    if (count($errors) > 0) {
        $errorMessages = [];
        foreach ($errors as $error) {
            $errorMessages[$error->getPropertyPath()] = $error->getMessage();
        }
        return $this->json(
            ['errors' => $errorMessages], 
            Response::HTTP_UNPROCESSABLE_ENTITY
        );
    }

    // 5. Persistir en la base de datos
    try {
        $entityManager->persist($user);
        $entityManager->flush();
    } catch (\Exception $e) {
        return $this->json(
            ['error' => 'Database error', 'details' => $e->getMessage()], 
            Response::HTTP_INTERNAL_SERVER_ERROR
        );
    }

    // 6. Retornar respuesta
return $this->json(
    $user,
    Response::HTTP_CREATED,
    [],
    ['groups' => 'user:read']
);
    }

    #[Route('/api/login', name: 'user_login', methods: ['POST'])]
    public function loginUser(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse
    {
        try {
            // Verificar y decodificar el JSON
            if (empty($request->getContent())) {
                return $this->json(['error' => 'Empty request body'], Response::HTTP_BAD_REQUEST);
            }
    
            try {
                $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                return $this->json(['error' => 'Invalid JSON format'], Response::HTTP_BAD_REQUEST);
            }
            
            // Validar campos 
            $requiredFields = ['email', 'password'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->json(['error' => "Field '$field' is required"], Response::HTTP_BAD_REQUEST);
                }
            }
            
            // Buscar el usuario por email
            $user = $entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']]);
            if (!$user) {
                return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
            }
            
            // Verificar la contraseña
            if (!$passwordHasher->isPasswordValid($user, $data['password'])) {
                return $this->json(['error' => 'Invalid password'], Response::HTTP_UNAUTHORIZED);
            }
            
            // Si todo es correcto, retornar respuesta de éxito
            return $this->json(
                [
                    'message' => 'Login successful',
                    'user' => $user
                ],
                Response::HTTP_OK,
                [],
                ['groups' => 'user:read']
            );
        } catch (\Exception $e) {
            // Log del error para depuración
            error_log('Login error: ' . $e->getMessage());
            
            return $this->json(
                ['error' => 'An unexpected error occurred', 'message' => $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}