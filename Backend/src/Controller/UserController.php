<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\User\UserInterface;


final class UserController extends AbstractController
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    #[Route('/user', name: 'app_user')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/UserController.php',
        ]);
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
}
