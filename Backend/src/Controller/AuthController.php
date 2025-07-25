<?php

namespace App\Controller;

use Symfony\Component\Validator\Validator\ValidatorInterface;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class AuthController extends AbstractController
{

    #[Route('/auth', name: 'app_auth')]
    public function index(): Response
    {
        return $this->render('auth/index.html.twig', [
            'controller_name' => 'AuthController',
        ]);
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

        // VALIDACIÓN ADICIONAL DE EMAIL 
        if (!preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $data['email'])) {
            return $this->json(
                ['error' => 'El email debe tener un formato válido (ejemplo: usuario@dominio.com)'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // VALIDACIÓN DE USERNAME 
        if (strlen($data['username']) < 3 || strlen($data['username']) > 20) {
            return $this->json(
                ['error' => 'El nombre de usuario debe tener entre 3 y 20 caracteres'],
                Response::HTTP_BAD_REQUEST
            );
        }

        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $data['username'])) {
            return $this->json(
                ['error' => 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // VALIDACIÓN DE PASSWORD 
        if (strlen($data['password']) < 6) {
            return $this->json(
                ['error' => 'La contraseña debe tener al menos 6 caracteres'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $userRepository = $entityManager->getRepository(User::class);

        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json(
                ['error' => 'Este Email ya está registrado'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        if ($userRepository->findOneBy(['username' => $data['username']])) {
            return $this->json(
                ['error' => 'Este Nombre de usuario ya está registrado'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }


        // 3. Crear y configurar el usuario
        $user = new User();
        $user->setUsername($data['username']);
        $user->setEmail($data['email']);
        $user->setPassword($passwordHasher->hashPassword($user, $data['password']));
        $user->setRoles($data['roles'] ?? ['ROLE_USER']); // Rol por defecto
        $user->setBanned(false);

        // 4. Validar la entidad
        $errors = $validator->validate($user) ?? [];
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
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'username' => $user->getUsername(),
                    'roles' => $user->getRoles(),
                    'avatar' => $user->getAvatar() ?? null,
                ],
            ],
            Response::HTTP_CREATED,
            [],
            ['groups' => 'user:read']
        );
    }


    #[Route('/api/auth/login', name: 'user_login', methods: ['POST'])]
    public function login(
        Request $request,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $JWTManager
    ): JsonResponse {
        try {
            // Decodificar JSON del request
            if (empty($request->getContent())) {
                return $this->json(['error' => 'Empty request body'], Response::HTTP_BAD_REQUEST);
            }

            try {
                $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                return $this->json(['error' => 'Invalid JSON format'], Response::HTTP_BAD_REQUEST);
            }

            // Validar campos obligatorios
            $requiredFields = ['email', 'password'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->json(
                        ['error' => "Field '$field' is required"],
                        Response::HTTP_BAD_REQUEST
                    );
                }
            }

            // Buscar usuario por email
            $user = $entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']]);
            if (!$user) {
                return $this->json(['error' => 'Usuario no registrado'], Response::HTTP_NOT_FOUND);
            }

            if ($user->isBanned()) {
                return $this->json(
                    ['error' => 'Access denied', 'message' => 'Tu cuenta ha sido suspendida'],
                    Response::HTTP_FORBIDDEN
                );
            }

            // Verificar contraseña
            if (!$passwordHasher->isPasswordValid($user, $data['password'])) {
                return $this->json(['error' => 'Contraseña incorrecta'], Response::HTTP_UNAUTHORIZED);
            }

            // Generar token JWT
            $token = $JWTManager->create($user);

            // Devolver token y datos de usuario
            return new JsonResponse([
                'token' => $token,
                'user' => [
                    'id' => $user->getId(),
                    'email' => $user->getEmail(),
                    'username' => $user->getUsername(),
                    'roles' => $user->getRoles(),
                    'avatar' => $user->getAvatar(),
                    'banned' => false,
                ]
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(
                ['error' => $e->getMessage()],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
