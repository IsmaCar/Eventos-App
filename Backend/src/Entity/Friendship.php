<?php

namespace App\Entity;

use App\Repository\FriendshipRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: FriendshipRepository::class)]
class Friendship
{
    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_BLOCKED = 'blocked';
    
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['friendship:read', 'user:profile'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'sentFriendships')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['friendship:read'])]
    private ?User $requester = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'receivedFriendships')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['friendship:read'])]
    private ?User $addressee = null;

    #[ORM\Column(length: 20)]
    #[Groups(['friendship:read', 'user:profile'])]
    private ?string $status = self::STATUS_PENDING;

    #[ORM\Column]
    #[Groups(['friendship:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRequester(): ?User
    {
        return $this->requester;
    }

    public function setRequester(?User $requester): self
    {
        $this->requester = $requester;
        return $this;
    }

    public function getAddressee(): ?User
    {
        return $this->addressee;
    }

    public function setAddressee(?User $addressee): self
    {
        $this->addressee = $addressee;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
