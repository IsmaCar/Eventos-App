<?php

namespace App\Controller;

use App\Entity\FavoritePhoto;
use App\Repository\FavoritePhotoRepository;
use App\Repository\PhotoRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;


#[Route('/api')]
final class PhotoController extends AbstractController
{

    #[Route('/photo', name: 'app_photo')]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/PhotoController.php',
        ]);
    }

    #[Route('/photos/{id}/favorite', name: 'app_photo_toggle_favorite', methods: ['POST'])]
    public function toggleFavorite(
        int $id,
        PhotoRepository $photoRepository,
        FavoritePhotoRepository $favoriteRepository,
        EntityManagerInterface $entityManager,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        $photo = $photoRepository->find($id);
        if (!$photo) {
            return $this->json(['message' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }

        // Verificar si ya está en favoritos
        $favorite = $favoriteRepository->findOneBy([
            'user' => $user,
            'photo' => $photo
        ]);

        if ($favorite) {
            // Si ya existe, eliminar de favoritos
            $entityManager->remove($favorite);
            $entityManager->flush();
            return $this->json(['message' => 'Foto eliminada de favoritos', 'isFavorite' => false]);
        } else {
            // Si no existe, añadir a favoritos
            $favorite = new FavoritePhoto();
            $favorite->setUser($user);
            $favorite->setPhoto($photo);

            $entityManager->persist($favorite);
            $entityManager->flush();

            return $this->json(['message' => 'Foto añadida a favoritos', 'isFavorite' => true]);
        }
    }

    #[Route('/photos/{id}/favorite', name: 'app_photo_check_favorite', methods: ['GET'])]
    public function checkFavorite(
        int $id,
        PhotoRepository $photoRepository,
        FavoritePhotoRepository $favoriteRepository,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['isFavorite' => false]);
        }

        $photo = $photoRepository->find($id);
        if (!$photo) {
            return $this->json(['message' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $favorite = $favoriteRepository->findOneBy([
            'user' => $user,
            'photo' => $photo
        ]);

        return $this->json(['isFavorite' => $favorite !== null]);
    }

    #[Route('/photos/{id}/is-favorite', name: 'app_photo_is_favorite', methods: ['GET'])]
    public function isPhotoFavorite(
        int $id,
        PhotoRepository $photoRepository,
        FavoritePhotoRepository $favoriteRepository,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['isFavorite' => false]);
        }

        $photo = $photoRepository->find($id);
        if (!$photo) {
            return $this->json(['message' => 'Foto no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $favorite = $favoriteRepository->findOneBy([
            'user' => $user,
            'photo' => $photo
        ]);

        return $this->json(['isFavorite' => $favorite !== null]);
    }

    #[Route('/user/favorite-photos', name: 'app_user_favorite_photos', methods: ['GET'])]
    public function getUserFavorites(
        FavoritePhotoRepository $favoriteRepository,
        Security $security
    ): JsonResponse {
        $user = $security->getUser();
        if (!$user) {
            return $this->json(['message' => 'Debes iniciar sesión'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            // Buscar favoritos del usuario
            $favorites = $favoriteRepository->findBy(['user' => $user]);

            $photosData = [];
            foreach ($favorites as $favorite) {
                // Verificar que la foto existe
                $photo = $favorite->getPhoto();
                if (!$photo) {
                    continue;
                }

                // Verificar que el evento existe
                $event = $photo->getEvent();
                if (!$event) {
                    continue;
                }

                // Obtener datos de la foto con manejo de posibles valores nulos
                $photosData[] = [
                    'id' => $photo->getId(),
                    'filename' => $photo->getUrlPhoto() ?? $photo->getFilename() ?? '',
                    'upload_date' => $photo->getUploadDate() ? $photo->getUploadDate()->format('Y-m-d H:i:s') : date('Y-m-d H:i:s'),
                    'event' => [
                        'id' => $event->getId(),
                        'title' => $event->getTitle() ?? 'Evento sin título'
                    ],
                    'user' => $photo->getUser() ? [
                        'id' => $photo->getUser()->getId(),
                        'username' => $photo->getUser()->getUsername() ?? 'Usuario'
                    ] : null
                ];
            }

            return $this->json([
                'total' => count($photosData),
                'photos' => $photosData
            ]);
        } catch (\Exception $e) {
            // Log error para depuración
            error_log('Error en getUserFavorites: ' . $e->getMessage());
            return $this->json(['message' => 'Error interno del servidor', 'error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
