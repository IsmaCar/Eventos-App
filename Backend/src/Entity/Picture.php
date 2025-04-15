<?php
// src/Entity/Picture.php
namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'Pictures')]
class Picture
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Event::class)]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id')]
    private Event $event;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id')]
    private User $user;

    #[ORM\Column(type: 'text')]
    private string $urlPicture;

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $uploadDate;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $deleted;

    // Getters y setters...

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUrlPicture(): ?string
    {
        return $this->urlPicture;
    }

    public function setUrlPicture(string $urlPicture): static
    {
        $this->urlPicture = $urlPicture;

        return $this;
    }

    public function getUploadDate(): ?\DateTimeInterface
    {
        return $this->uploadDate;
    }

    public function setUploadDate(\DateTimeInterface $uploadDate): static
    {
        $this->uploadDate = $uploadDate;

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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}

?>