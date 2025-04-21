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
            [
                'message' => 'User created successfully',
                'user' => $user,
                'next' => 'Use /api/login_check with email and password to get your JWT token'
            ],
            Response::HTTP_CREATED,
            [],
            ['groups' => 'user:read']
        );
    }
    #[Route('/api/me', name: 'current_user', methods: ['GET'])]
    public function getCurrentUser(): JsonResponse
    {
        // Obtener el usuario autenticado
        $user = $this->getUser();

        // Verificar si hay un usuario autenticado
        if (!$user) {
            return $this->json(['error' => 'No authenticated user'], Response::HTTP_UNAUTHORIZED);
        }

        // Devolver la información del usuario
        return $this->json(
            $user,
            Response::HTTP_OK,
            [],
            ['groups' => 'user:read']
        );
    }
    #[Route('/api/users', name: 'get_all_users', methods: ['GET'])]
    public function getAllUsers(EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            // Obtener todos los usuarios desde el repositorio
            $users = $entityManager->getRepository(User::class)->findAll();

            // Verificar si hay usuarios
            if (empty($users)) {
                return $this->json([
                    'message' => 'No users found in the database'
                ], Response::HTTP_OK);
            }

            // Retornar la lista de usuarios
            return $this->json(
                [
                    'total' => count($users),
                    'users' => $users
                ],
                Response::HTTP_OK,
                [],
                ['groups' => 'user:read']
            );
        } catch (\Exception $e) {
            // Capturar cualquier error
            return $this->json(
                ['error' => 'Error retrieving users', 'details' => $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
