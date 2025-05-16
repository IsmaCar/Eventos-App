<?php

namespace App\Repository;

use App\Entity\Friendship;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Friendship>
 */
class FriendshipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Friendship::class);
    }

    /**
     * Comprueba si existe una solicitud de amistad entre dos usuarios
     */
    public function findFriendshipBetween(User $user1, User $user2): ?Friendship
    {
        return $this->createQueryBuilder('f')
            ->where('(f.requester = :user1 AND f.addressee = :user2) OR (f.requester = :user2 AND f.addressee = :user1)')
            ->setParameter('user1', $user1)
            ->setParameter('user2', $user2)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Encuentra todas las amistades aceptadas de un usuario
     */
    public function findAcceptedFriendships(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->where('(f.requester = :user OR f.addressee = :user)')
            ->andWhere('f.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', Friendship::STATUS_ACCEPTED)
            ->getQuery()
            ->getResult();
    }

    /**
     * Encuentra todas las solicitudes de amistad pendientes recibidas por un usuario
     */
    public function findPendingFriendRequests(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.addressee = :user')
            ->andWhere('f.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', Friendship::STATUS_PENDING)
            ->getQuery()
            ->getResult();
    }

    /**
     * Encuentra todas las solicitudes de amistad enviadas por un usuario que aún están pendientes
     */
    public function findSentPendingRequests(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.requester = :user')
            ->andWhere('f.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', Friendship::STATUS_PENDING)
            ->getQuery()
            ->getResult();
    }

    /**
     * Encuentra todas las relaciones de amistad de un usuario (cualquier estado)
     */
    public function findAllUserFriendships(User $user): array
    {
        return $this->createQueryBuilder('f')
            ->where('f.requester = :user OR f.addressee = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    /**
     * Verifica si dos usuarios son amigos
     */
    public function areFriends(User $user1, User $user2): bool
    {
        $friendship = $this->findFriendshipBetween($user1, $user2);
        
        return $friendship !== null && $friendship->getStatus() === Friendship::STATUS_ACCEPTED;
    }


    //    /**
    //     * @return FriendShip[] Returns an array of FriendShip objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('f')
    //            ->andWhere('f.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('f.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?FriendShip
    //    {
    //        return $this->createQueryBuilder('f')
    //            ->andWhere('f.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
