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
