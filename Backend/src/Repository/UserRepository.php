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


    // Obtiene las estadísticas de un usuario específico

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


    // Obtiene las estadísticas de un usuario por ID

    public function getUserStatsById(int $userId): array
    {
        // Solicitudes de amistad pendientes
        $friendRequests = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(f.id)')
            ->from('App\Entity\Friendship', 'f')
            ->where('f.addressee = :userId AND f.status = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', 'pending')
            ->getQuery()
            ->getSingleScalarResult();

        // Invitaciones a eventos pendientes
        $invitationsPending = $this->getEntityManager()
            ->createQueryBuilder()
            ->select('COUNT(i.id)')
            ->from('App\Entity\Invitation', 'i')
            ->where('i.invitedUser = :userId AND i.status = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', 'pending')
            ->getQuery()
            ->getSingleScalarResult();



        return [
            'friendRequests' => (int) $friendRequests,
            'invitationsPending' => (int) $invitationsPending,
        ];
    }

    public function getEventByUserId(int $userId): array
    {
        try {
            return $this->getEntityManager()
                ->createQueryBuilder()
                ->select('e')
                ->from('App\Entity\Event', 'e')
                ->where('e.user = :userId')
                ->andWhere('e.banned = :banned')
                ->andWhere('e.status = :status')
                ->setParameter('userId', $userId)
                ->setParameter('banned', false)
                ->setParameter('status', 'activated')
                ->orderBy('e.event_date', 'DESC')
                ->getQuery()
                ->getResult();
        } catch (\Exception $e) {
            error_log('Error en getEventByUserId: ' . $e->getMessage());
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

    /**
     * Buscar usuarios por término de búsqueda (username o email)
     */
    public function findBySearchTerm(string $term, array $excludeIds = []): array
    {
        $qb = $this->createQueryBuilder('u')
            ->where('u.username LIKE :term OR u.email LIKE :term')
            ->setParameter('term', '%' . $term . '%');

        // Excluir IDs específicos (como el usuario actual)
        if (!empty($excludeIds)) {
            $qb->andWhere('u.id NOT IN (:excludeIds)')
                ->setParameter('excludeIds', $excludeIds);
        }

        // Excluir usuarios baneados
        $qb->andWhere('u.banned = :banned')
            ->setParameter('banned', false)
            ->setMaxResults(20);

        return $qb->getQuery()->getResult();
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
