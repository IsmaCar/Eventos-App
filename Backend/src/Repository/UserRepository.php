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
