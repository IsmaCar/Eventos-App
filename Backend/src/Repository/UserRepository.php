<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Used to upgrade (rehash) the user's password automatically over time.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /**
     * Obtiene las estadísticas de un usuario específico
     * @param User $user El usuario del que queremos las estadísticas
     * @return array Array con las estadísticas del usuario
     */
    public function getUserStats(User $user): array
    {
        // Eventos creados por el usuario
        $eventsCreated = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(e.id)')
            ->from('App\Entity\Event', 'e')
            ->where('e.user_id = :userId')
            ->setParameter('userId', $user->getId())
            ->getQuery()
            ->getSingleScalarResult();

        // Fotos subidas por el usuario
        $photosUploaded = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(p.id)')
            ->from('App\Entity\Photo', 'p')
            ->where('p.user = :userId')
            ->setParameter('userId', $user->getId())
            ->getQuery()
            ->getSingleScalarResult();



        return [
            'eventsCreated' => (int) $eventsCreated,
            'photosUploaded' => (int) $photosUploaded,
        ];
    }

    /**
     * Obtiene las estadísticas de un usuario por ID
     * @param int $userId ID del usuario
     * @return array Array con las estadísticas del usuario
     */
    public function getUserStatsById(int $userId): array
    {
        // Eventos creados por el usuario
        $eventsCreated = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(e.id)')
            ->from('App\Entity\Event', 'e')
            ->where('e.user = :user')
            ->setParameter('user', $userId)
            ->getQuery()
            ->getSingleScalarResult();

        // Fotos subidas por el usuario
        $photosUploaded = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(p.id)')
            ->from('App\Entity\Photo', 'p')
            ->where('p.user = :user')
            ->setParameter('user', $userId)
            ->getQuery()
            ->getSingleScalarResult();

        return [
            'eventsCreated' => (int) $eventsCreated,
            'photosUploaded' => (int) $photosUploaded,
        ];
    }

    public function getEventByUserId(int $userId): array
    {
        try {
            // Buscar eventos donde el usuario sea el creador
            return $this->getEntityManager()
                ->createQueryBuilder()
                ->select('e') // Seleccionamos la entidad Event completa
                ->from('App\Entity\Event', 'e')
                ->where('e.user = :userId') // Usando la relación directa con la entidad User
                ->setParameter('userId', $userId)
                ->orderBy('e.event_date', 'DESC') // Ordenados por fecha de creación descendente
                ->getQuery()
                ->getResult();
        } catch (\Exception $e) {
            // Log del error para facilitar la depuración
            error_log('Error en getEventByUserId: ' . $e->getMessage());

            // En caso de error, devolver un array vacío en lugar de propagar la excepción
            return [];
        }
    }

    public function searchUsers(string $query)
    {
        return $this->createQueryBuilder('u')
            ->where('u.username LIKE :query OR u.email LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult();
    }

    public function findByEmailInsensitive(string $email): ?User
    {
        return $this->createQueryBuilder('u')
            ->where('LOWER(u.email) = :email')
            ->setParameter('email', strtolower($email))
            ->getQuery()
            ->getOneOrNullResult();
    }
    // public function getAllUsers(): array
    // {
    //     try {
    //         // Obtener todos los usuarios
    //         return $this->getEntityManager()
    //             ->createQueryBuilder()
    //             ->select('u') 
    //             ->from('App\Entity\User', 'u')
    //             ->orderBy('u.id', 'ASC') 
    //             ->getQuery()
    //             ->getResult();
    //     } catch (\Exception $e) {
    //         // Log del error para facilitar la depuración
    //         error_log('Error en getAllUsers: ' . $e->getMessage());

    //         // En caso de error, devolver un array vacío en lugar de propagar la excepción
    //         return [];
    //     }
    // }

    //    /**
    //     * @return User[] Returns an array of User objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('u.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?User
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
