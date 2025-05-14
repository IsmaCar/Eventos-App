<?php

namespace App\Repository;

use App\Entity\Event;
use App\Entity\Invitation;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Invitation>
 */
class InvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Invitation::class);
    }

    /**
     * Busca invitaciones pendientes para un email
     */
    public function findPendingByEmail(string $email): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.email = :email')
            ->andWhere('i.status = :status')
            ->setParameter('email', $email)
            ->setParameter('status', Invitation::STATUS_PENDING)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Busca invitaciones para un usuario
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.invitedUser = :user OR i.email = :email')
            ->setParameter('user', $user)
            ->setParameter('email', $user->getEmail())
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Verifica si un usuario ya fue invitado a un evento
     */
    public function isUserInvited(User $user, Event $event): bool
    {
        $result = $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->andWhere('i.event = :event')
            ->andWhere('i.invitedUser = :user OR i.email = :email')
            ->setParameter('event', $event)
            ->setParameter('user', $user)
            ->setParameter('email', $user->getEmail())
            ->getQuery()
            ->getSingleScalarResult();

        return $result > 0;
    }

    /**
     * Verifica si un email ya fue invitado a un evento
     */
    public function isEmailInvited(string $email, Event $event): bool
    {
        $result = $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->andWhere('i.event = :event')
            ->andWhere('i.email = :email')
            ->setParameter('event', $event)
            ->setParameter('email', $email)
            ->getQuery()
            ->getSingleScalarResult();

        return $result > 0;
    }

    public function findByUserOrEmail($user, $email)
    {
        return $this->createQueryBuilder('i')
            ->leftJoin('i.invitedUser', 'u')
            ->where('u = :user OR i.email = :email')
            ->setParameter('user', $user)
            ->setParameter('email', $email)
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }


    //    /**
    //     * @return Invitation[] Returns an array of Invitation objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('i')
    //            ->andWhere('i.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('i.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Invitation
    //    {
    //        return $this->createQueryBuilder('i')
    //            ->andWhere('i.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
