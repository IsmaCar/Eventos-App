<?php

namespace App\Repository;

use App\Entity\Event;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Event>
 */
class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    public function getAllEvents(bool $futureOnly = false, ?int $limit = null, int $offset = 0): array
    {
        try {
            $queryBuilder = $this->getEntityManager()
                ->createQueryBuilder()
                ->select('e')
                ->from('App\Entity\Event', 'e');

            // Si solo queremos eventos futuros
            if ($futureOnly) {
                $queryBuilder->andWhere('e.event_date >= :now')
                    ->setParameter('now', new \DateTime());
            }

            // Ordenar por fecha ascendente (primero los más próximos)
            $queryBuilder->orderBy('e.event_date', 'ASC');

            // Aplicar límite si se especifica
            if ($limit !== null) {
                $queryBuilder->setMaxResults($limit)
                    ->setFirstResult($offset);
            }

            return $queryBuilder->getQuery()->getResult();
        } catch (\Exception $e) {
            error_log('Error en getAllEvents: ' . $e->getMessage());
            return [];
        }
    }

    public function findUserEvents($user)
    {
        // 1. Obtener eventos donde el usuario es propietario
        $ownedEvents = $this->createQueryBuilder('e')
            ->where('e.user = :user')
            ->andWhere('e.banned = :banned')
            ->setParameter('user', $user)
            ->setParameter('banned', false)
            ->getQuery()
            ->getResult();

        // 2. Obtener eventos donde el usuario ha aceptado invitaciones
        $invitedEvents = $this->createQueryBuilder('e')
            ->join('App\Entity\Invitation', 'i', 'WITH', 'i.event = e.id')
            ->where('i.invitedUser = :user')
            ->andWhere('i.status = :status')
            ->andWhere('e.banned = :banned')
            ->setParameter('user', $user)
            ->setParameter('status', 'accepted')
            ->setParameter('banned', false)
            ->getQuery()
            ->getResult();

        // 3. Combinar y eliminar duplicados
        $combinedEvents = array_merge($ownedEvents, $invitedEvents);

        // Usar un array indexado por ID para eliminar duplicados eficientemente
        $uniqueEvents = [];
        foreach ($combinedEvents as $event) {
            $uniqueEvents[$event->getId()] = $event;
        }

        return array_values($uniqueEvents);
    }
    //    /**
    //     * @return Event[] Returns an array of Event objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('e')
    //            ->andWhere('e.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('e.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Event
    //    {
    //        return $this->createQueryBuilder('e')
    //            ->andWhere('e.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
