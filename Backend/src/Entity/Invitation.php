<?php
// src/Entity/Invitation.php
namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'Invitations')]
class Invitation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Event::class)]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id')]
    private Event $event;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_organiser_id', referencedColumnName: 'id')]
    private User $userOrganiser;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_guest_id', referencedColumnName: 'id', nullable: true)]
    private ?User $userGuest;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $emailGuest;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $sendDate;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $deleted;

    // Getters y setters...

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmailGuest(): ?string
    {
        return $this->emailGuest;
    }

    public function setEmailGuest(?string $emailGuest): static
    {
        $this->emailGuest = $emailGuest;

        return $this;
    }

    public function getSendDate(): ?\DateTimeInterface
    {
        return $this->sendDate;
    }

    public function setSendDate(\DateTimeInterface $sendDate): static
    {
        $this->sendDate = $sendDate;

        return $this;
    }

    public function isDeleted(): ?bool
    {
        return $this->deleted;
    }

    public function setDeleted(bool $deleted): static
    {
        $this->deleted = $deleted;

        return $this;
    }

    public function getEvent(): ?Event
    {
        return $this->event;
    }

    public function setEvent(?Event $event): static
    {
        $this->event = $event;

        return $this;
    }

    public function getUserOrganiser(): ?User
    {
        return $this->userOrganiser;
    }

    public function setUserOrganiser(?User $userOrganiser): static
    {
        $this->userOrganiser = $userOrganiser;

        return $this;
    }

    public function getUserGuest(): ?User
    {
        return $this->userGuest;
    }

    public function setUserGuest(?User $userGuest): static
    {
        $this->userGuest = $userGuest;

        return $this;
    }
}

?>